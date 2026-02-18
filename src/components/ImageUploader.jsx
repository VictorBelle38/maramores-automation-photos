import React, { useCallback, useEffect, useRef, useState } from "react";
import heic2any from "heic2any";

const ImageUploader = () => {
  // State now stores objects: { id, file, preview, name }
  const [selectedImages, setSelectedImages] = useState([]);
  const [propertyName, setPropertyName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // New state for HEIC conversion
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const fileInputRef = useRef(null);
  const selectedImagesRef = useRef([]);

  // Configurações de ambiente vindas do window (definidas no main.jsx)
  const webhookUrl = window.WEBHOOK_URL || "https://n8nmaramores.bdntech.com.br/webhook/envio-fotos";
  const maxInputFileSize = window.MAX_INPUT_FILE_SIZE || 80 * 1024 * 1024;
  const maxUploadFileSize = window.MAX_UPLOAD_FILE_SIZE || 20 * 1024 * 1024;
  const allowedTypes = window.ALLOWED_TYPES || [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
  const mobileMaxDimension = window.MOBILE_MAX_DIMENSION || 2560;
  const mobileJpegQuality = window.MOBILE_JPEG_QUALITY || 0.86;
  const batchSize = window.BATCH_SIZE || 5;
  const batchDelayMs = window.BATCH_DELAY_MS || 30000;
  const maxMobileImagesInMemory = 50;
  const isIOSSafari =
    /iP(hone|ad|od)/i.test(navigator.userAgent) &&
    /WebKit/i.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);

  // Keep latest list for cleanup on unmount
  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const getExt = (name = "") => name.split(".").pop()?.toLowerCase() || "";
  const allowedExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
  const isHeicFile = (file) => {
    const ext = getExt(file.name);
    return (
      ext === "heic" ||
      ext === "heif" ||
      file.type === "image/heic" ||
      file.type === "image/heif"
    );
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadImageFromBlob = useCallback((blob) => {
    return new Promise((resolve, reject) => {
      const imageUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(imageUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Nao foi possivel ler a imagem."));
      };
      img.src = imageUrl;
    });
  }, []);

  const canvasToBlob = useCallback((canvas, type, quality) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Falha ao converter canvas para blob."));
            return;
          }
          resolve(blob);
        },
        type,
        quality
      );
    });
  }, []);

  const buildOptimizedFile = useCallback(
    async (blob, originalName, quality, maxDimension = mobileMaxDimension) => {
      const image = await loadImageFromBlob(blob);
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height)
      );
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        throw new Error("Falha ao iniciar contexto de imagem.");
      }

      context.drawImage(image, 0, 0, width, height);
      const optimizedBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      canvas.width = 0;
      canvas.height = 0;

      const targetName = originalName.replace(
        /\.(heic|heif|png|webp|jpeg|jpg)$/i,
        ".jpg"
      );

      return new File([optimizedBlob], targetName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    },
    [canvasToBlob, loadImageFromBlob, mobileMaxDimension]
  );

  const buildThumbnailUrl = useCallback(
    async (file) => {
      const image = await loadImageFromBlob(file);
      const canvas = document.createElement("canvas");
      const maxThumbDimension = 420;
      const scale = Math.min(
        1,
        maxThumbDimension / Math.max(image.width, image.height)
      );
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        throw new Error("Falha ao gerar preview da imagem.");
      }

      context.drawImage(image, 0, 0, width, height);
      const thumbBlob = await canvasToBlob(canvas, "image/jpeg", 0.7);
      canvas.width = 0;
      canvas.height = 0;

      return URL.createObjectURL(thumbBlob);
    },
    [canvasToBlob, loadImageFromBlob]
  );

  const prepareFileForUpload = useCallback(
    async (file) => {
      let sourceBlob = file;
      if (isHeicFile(file)) {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: mobileJpegQuality,
        });
        sourceBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      }

      try {
        return await buildOptimizedFile(
          sourceBlob,
          file.name,
          mobileJpegQuality,
          mobileMaxDimension
        );
      } catch (err) {
        if (isIOSSafari) {
          return buildOptimizedFile(sourceBlob, file.name, 0.8, 2048);
        }
        throw err;
      }
    },
    [buildOptimizedFile, isIOSSafari, mobileJpegQuality, mobileMaxDimension]
  );

  const validateFile = useCallback((file) => {
    const ext = getExt(file.name);
    const typeAllowed =
      allowedTypes.includes(file.type) || allowedExt.includes(ext) || isHeicFile(file);
    const sizeAllowed = file.size <= maxInputFileSize;
    return typeAllowed && sizeAllowed;
  }, [allowedTypes, maxInputFileSize]);

  const processFiles = useCallback(
    async (fileArray) => {
      if (!Array.isArray(fileArray) || fileArray.length === 0) {
        return;
      }

      setIsProcessing(true);
      setMessage({ type: "", text: "" });
      setProgressText("Registrando selecao...");

      const validFiles = [];
      let rejectedCount = 0;
      const currentMobileCount = isMobile ? selectedImages.length : 0;

      try {
        if (isMobile && currentMobileCount >= maxMobileImagesInMemory) {
          setMessage({
            type: "error",
            text: `Limite de ${maxMobileImagesInMemory} imagens no mobile para evitar travamentos.`,
          });
          return;
        }

        for (const [index, file] of fileArray.entries()) {
          if (!validateFile(file)) {
            rejectedCount++;
            continue;
          }

          if (
            isMobile &&
            currentMobileCount + validFiles.length >= maxMobileImagesInMemory
          ) {
            rejectedCount++;
            continue;
          }

          let optimizedFile;
          let previewUrl;

          try {
            setProgressText(
              `Preparando preview ${index + 1}/${fileArray.length}: ${file.name}`
            );
            optimizedFile = file;
            previewUrl = await buildThumbnailUrl(file);
          } catch (err) {
            console.error("Error processing image:", err);
            rejectedCount++;
            continue;
          }

          const uniqueId = `${file.name}-${file.size}-${file.lastModified}`;
          const isDuplicate =
            selectedImages.some((img) => img.id === uniqueId) ||
            validFiles.some((img) => img.id === uniqueId);

          if (!isDuplicate) {
            validFiles.push({
              id: uniqueId,
              file: optimizedFile,
              preview: previewUrl,
              name: file.name,
            });
          } else if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          if (isMobile || isIOSSafari) {
            await wait(150);
          }
        }

        if (validFiles.length === 0 && rejectedCount === 0) {
          setMessage({
            type: "error",
            text: "Nenhuma imagem foi selecionada.",
          });
          return;
        }

        if (rejectedCount > 0) {
          const maxSizeMB = Math.round(maxInputFileSize / (1024 * 1024));
          setMessage({
            type: "error",
            text: `${rejectedCount} arquivo(s) ignorado(s). Limite de entrada: ${maxSizeMB}MB por imagem.`,
          });
        }

        setSelectedImages((prev) => [...prev, ...validFiles]);
      } finally {
        setIsProcessing(false);
        setProgressText("");
      }
    },
    [
      buildThumbnailUrl,
      isIOSSafari,
      isMobile,
      maxInputFileSize,
      maxMobileImagesInMemory,
      selectedImages,
      validateFile,
    ]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      const fileArray = files ? Array.from(files) : [];
      processFiles(fileArray);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = e.target?.files;
      if (!files || files.length === 0) {
        return;
      }
      const fileArray = Array.from(files);
      // Reset input so same file can be selected again if removed
      e.target.value = "";
      setProgressText("Selecionando arquivos...");
      setTimeout(() => {
        processFiles(fileArray);
      }, 0);
    },
    [processFiles]
  );

  const removeImage = useCallback((index) => {
    setSelectedImages((prev) => {
      const imgToRemove = prev[index];
      if (imgToRemove && imgToRemove.preview) {
        URL.revokeObjectURL(imgToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Funções para seleção e troca no mobile
  const handleImageClick = useCallback(
    (index) => {
      if (!isMobile) return;

      if (selectedImageIndex === null) {
        // Primeira seleção
        setSelectedImageIndex(index);
      } else if (selectedImageIndex === index) {
        // Clicou na mesma imagem - deselecionar
        setSelectedImageIndex(null);
      } else {
        // Segunda seleção - trocar posições
        setSelectedImages((prev) => {
          const newImages = [...prev];
          [newImages[selectedImageIndex], newImages[index]] = [
            newImages[index],
            newImages[selectedImageIndex],
          ];
          return newImages;
        });
        setSelectedImageIndex(null);
      }
    },
    [isMobile, selectedImageIndex]
  );

  // Funções para drag and drop de reordenação
  const handleImageDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // We can't drag the ghost image easily if it's not an img tag directly under cursor sometimes,
    // but the default behavior usually works.
    e.target.style.opacity = "0.5";
  }, []);

  const handleImageDragEnd = useCallback((e) => {
    e.target.style.opacity = "";
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleImageDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleImageDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOverIndex(null);
  }, []);

  const handleImageDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();

      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      setSelectedImages((prev) => {
        const newImages = [...prev];
        const draggedItem = newImages[draggedIndex];

        // Remove o item da posição original
        newImages.splice(draggedIndex, 1);

        // Insere o item na nova posição
        newImages.splice(dropIndex, 0, draggedItem);

        return newImages;
      });

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex]
  );

  const buildFixedBatches = useCallback(
    (images) => {
      const batches = [];
      for (let i = 0; i < images.length; i += batchSize) {
        const currentBatch = images.slice(i, i + batchSize);
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
        }
      }
      return batches;
    },
    [batchSize]
  );

  const uploadImages = async (propertyName) => {
    let wakeLock = null;
    try {
      setIsUploading(true);
      setProgress(0);
      setProgressText("Preparando upload...");
      setMessage({ type: "", text: "" });

      if ("wakeLock" in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request("screen");
          console.log("Wake Lock is active");
        } catch (err) {
          console.warn("Wake Lock request failed:", err);
        }
      }

      if (
        !webhookUrl ||
        webhookUrl.includes("{{WEBHOOK_URL}}") ||
        webhookUrl.includes("seu-dominio.com")
      ) {
        throw new Error(
          "URL do formulario nao configurada corretamente. Verifique as variaveis de ambiente na Vercel."
        );
      }

      const batches = buildFixedBatches(selectedImages);
      const totalBatches = batches.length;
      const uploadSessionId = `sess-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      let successfulUploads = 0;
      let failedUploads = 0;

      setProgressText(
        `Iniciando upload em ${totalBatches} lote(s) com envio seguro para mobile...`
      );

      if (totalBatches > 1) {
        setProgressText("Preparando servidor...");
        await wait(1500);
      }

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchImages = batches[batchIndex];
        const batchSequenceStartIndex = batchIndex * batchSize;

        setProgressText(
          `Processando lote ${batchIndex + 1}/${totalBatches} (${batchImages.length} imagens)...`
        );

        const preparedBatch = [];
        let skippedInBatch = 0;
        for (const img of batchImages) {
          try {
            const preparedFile = await prepareFileForUpload(img.file);
            if (preparedFile.size > maxUploadFileSize) {
              skippedInBatch++;
              continue;
            }
            preparedBatch.push({ original: img, file: preparedFile });
          } catch (error) {
            console.error("Erro ao preparar imagem para upload:", error);
            skippedInBatch++;
          }
        }

        if (skippedInBatch > 0) {
          failedUploads += skippedInBatch;
          const maxUploadMB = Math.round(maxUploadFileSize / (1024 * 1024));
          setMessage({
            type: "error",
            text: `${skippedInBatch} arquivo(s) acima do limite de upload (${maxUploadMB}MB) apos otimizacao.`,
          });
        }

        if (preparedBatch.length === 0) {
          setProgress(((batchIndex + 1) / totalBatches) * 100);
          continue;
        }

        setProgressText(
          `Enviando lote ${batchIndex + 1}/${totalBatches} (${preparedBatch.length} imagens, enviadas ${successfulUploads}/${selectedImages.length})...`
        );

        let batchSuccess = false;
        let retryCount = 0;
        const maxRetries = 2;

        while (!batchSuccess && retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              setProgressText(
                `Tentativa ${retryCount + 1} - Lote ${batchIndex + 1}/${totalBatches}`
              );
              await wait(3000);
            }

            const formData = new FormData();

            preparedBatch.forEach((img, index) => {
              formData.append("Fotos", img.file);
              console.log(
                `Adicionando imagem ${index + 1} do lote ${batchIndex + 1}: ${img.original.name} (${img.file.size} bytes)`
              );
            });

            formData.append("Nome da Propriedade (Apelido)", propertyName);
            formData.append("batchNumber", batchIndex + 1);
            formData.append("totalBatches", totalBatches);
            formData.append("imagesInBatch", preparedBatch.length);
            formData.append("uploadSessionId", uploadSessionId);
            formData.append("batchSequenceStartIndex", batchSequenceStartIndex);
            formData.append("totalImages", selectedImages.length);
            formData.append("uploadTimestamp", new Date().toISOString());

            const response = await fetch(webhookUrl, {
              method: "POST",
              body: formData,
              headers: {
                Accept: "application/json",
              },
            });

            if (response.ok) {
              successfulUploads += preparedBatch.length;
              batchSuccess = true;
            } else {
              const errorText = await response.text();
              console.error(
                `Erro no lote ${batchIndex + 1} (tentativa ${retryCount + 1}):`,
                errorText
              );

              if (retryCount === maxRetries) {
                failedUploads += preparedBatch.length;
                setMessage({
                  type: "error",
                  text: `Erro no lote ${batchIndex + 1} apos ${
                    maxRetries + 1
                  } tentativas: ${errorText}`,
                });
              }
            }
          } catch (error) {
            console.error(
              `Erro no lote ${batchIndex + 1} (tentativa ${retryCount + 1}):`,
              error
            );

            if (retryCount === maxRetries) {
              failedUploads += preparedBatch.length;
              setMessage({
                type: "error",
                text: `Erro no lote ${batchIndex + 1} apos ${
                  maxRetries + 1
                } tentativas: ${error.message}`,
              });
            }
          }

          retryCount++;
        }

        setProgress(((batchIndex + 1) / totalBatches) * 100);

        if (batchIndex < totalBatches - 1) {
          const startWait = Date.now();
          const waitTime = batchDelayMs;

          while (Date.now() - startWait < waitTime) {
            const remaining = Math.ceil(
              (waitTime - (Date.now() - startWait)) / 1000
            );
            setProgressText(`Aguardando ${remaining}s para o proximo lote...`);
            await wait(1000);
          }
        }
      }

      if (failedUploads === 0) {
        setProgress(100);
        setProgressText(
          `Todas as ${selectedImages.length} imagens foram enviadas com sucesso em ${totalBatches} lote(s).`
        );
        setMessage({
          type: "success",
          text: `Upload concluido! ${successfulUploads} imagens enviadas com sucesso.`,
        });

        setTimeout(() => {
          selectedImagesRef.current.forEach((img) => {
            if (img.preview) {
              URL.revokeObjectURL(img.preview);
            }
          });
          setSelectedImages([]);
          setPropertyName("");
          setProgress(0);
          setProgressText("");
          setMessage({ type: "", text: "" });
        }, 3000);
      } else if (successfulUploads > 0) {
        setProgress(100);
        setProgressText("Upload parcialmente concluido");
        setMessage({
          type: "error",
          text: `Upload parcial: ${successfulUploads} imagens enviadas, ${failedUploads} falharam. Tente novamente com as imagens que falharam.`,
        });
      } else {
        setProgress(0);
        setProgressText("");
        setMessage({
          type: "error",
          text: "Falha no upload de todos os lotes. Verifique sua conexao e tente novamente.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Erro ao enviar imagens. Verifique sua conexao e tente novamente.",
      });
    } finally {
      setIsUploading(false);
      if (wakeLock) {
        try {
          await wakeLock.release();
          console.log("Wake Lock released");
        } catch (err) {
          console.error("Error releasing Wake Lock:", err);
        }
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedImages.length === 0) {
      setMessage({
        type: "error",
        text: "Por favor, selecione pelo menos uma imagem.",
      });
      return;
    }

    if (!propertyName.trim()) {
      setMessage({
        type: "error",
        text: "Por favor, digite o nome da propriedade.",
      });
      return;
    }

    await uploadImages(propertyName);
  };

  const canSubmit =
    selectedImages.length > 0 && propertyName.trim() !== "" && !isUploading && !isProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property Name Input */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-white/90 uppercase tracking-wide">
          Nome da Propriedade
        </label>
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder="Digite o nome da propriedade"
          className="input-field"
          required
        />
      </div>

      {/* File Upload Area */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-white/90 uppercase tracking-wide">
          Selecionar Imagens
        </label>
        <div
          className={`upload-area ${isDragOver ? "dragover" : ""} ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
             <div className="flex flex-col items-center">
                <i className="fas fa-cog fa-spin text-6xl text-primary-400 mb-4"></i>
                <p className="text-xl font-bold text-white mb-2">Processando imagens...</p>
             </div>
          ) : (
            <>
                <i className="fas fa-cloud-upload-alt text-6xl text-primary-400 mb-4 block transition-all duration-300 hover:text-secondary-400 hover:scale-110"></i>
                <p className="text-xl font-bold text-white mb-2">
                    Clique aqui ou arraste as imagens
                </p>
                <p className="text-white/70">
                    JPG, PNG, HEIC ate {Math.round(maxInputFileSize / (1024 * 1024))}MB (entrada)
                </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            onChange={handleFileSelect}
            className="upload-input-overlay"
            disabled={isProcessing}
            aria-label="Selecionar imagens"
          />
        </div>
      </div>

      {/* Image Preview */}
      {selectedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Imagens Selecionadas ({selectedImages.length})
            </h3>
            <div className="text-sm text-white/70 flex items-center gap-2">
              <i className="fas fa-info-circle"></i>
              <span>
                {isMobile
                  ? "Clique em uma imagem e depois em outra para trocar de posição"
                  : "Arraste as imagens para reordenar"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedImages.map((img, index) => (
              <div
                key={img.id}
                className={`image-card group relative transition-all duration-200 ${
                  !isMobile ? "cursor-move" : "cursor-pointer"
                } ${draggedIndex === index ? "opacity-50 scale-95" : ""} ${
                  dragOverIndex === index && draggedIndex !== index
                    ? "ring-2 ring-blue-400 ring-opacity-75 scale-105"
                    : ""
                } ${
                  isMobile && selectedImageIndex === index
                    ? "ring-2 ring-yellow-400 ring-opacity-75 scale-105"
                    : ""
                }`}
                draggable={!isMobile}
                onDragStart={
                  !isMobile ? (e) => handleImageDragStart(e, index) : undefined
                }
                onDragEnd={!isMobile ? handleImageDragEnd : undefined}
                onDragOver={
                  !isMobile ? (e) => handleImageDragOver(e, index) : undefined
                }
                onDragLeave={!isMobile ? handleImageDragLeave : undefined}
                onDrop={
                  !isMobile ? (e) => handleImageDrop(e, index) : undefined
                }
                onClick={isMobile ? () => handleImageClick(index) : undefined}
              >
                <div className="absolute top-1 left-1 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {index + 1}
                </div>

                {/* Indicador de seleção para mobile */}
                {isMobile && selectedImageIndex === index && (
                  <div className="absolute top-1 right-8 z-10 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    SELECIONADA
                  </div>
                )}

                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-full h-24 object-cover"
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-110 z-20"
                >
                  x
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center truncate">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {(isUploading || isProcessing) && (
        <div className="space-y-2">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-white/70 text-sm whitespace-pre-line">{progressText}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg font-bold uppercase tracking-wider ${
          !canSubmit ? "opacity-50 cursor-not-allowed" : ""
        } ${isUploading ? "animate-pulse" : ""}`}
      >
        {isUploading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Enviando...
          </>
        ) : isProcessing ? (
           <>
            <i className="fas fa-cog fa-spin"></i>
            Processando...
           </>
        ) : (
          <>
            <i className="fas fa-paper-plane"></i>
            Enviar Imagens
          </>
        )}
      </button>

      {/* Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center font-semibold flex items-center justify-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/50 text-green-400"
              : "bg-red-500/20 border border-red-500/50 text-red-400"
          }`}
        >
          <i
            className={`fas ${
              message.type === "success"
                ? "fa-check-circle"
                : "fa-exclamation-triangle"
            }`}
          ></i>
          {message.text}
        </div>
      )}
    </form>
  );
};

export default ImageUploader;
