import React, { useCallback, useEffect, useRef, useState } from "react";

const ImageUploader = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [propertyName, setPropertyName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const fileInputRef = useRef(null);
  const webhookUrl =
    window.__WEBHOOK_URL__ ||
    "https://n8nmaramores.bdntech.com.br/webhook/envio-fotos";
  const maxFileSize = window.__MAX_FILE_SIZE__ || 10 * 1024 * 1024;
  const allowedTypes = window.__ALLOWED_TYPES__ || [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

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

  const validateFile = useCallback(
    (file) => {
      if (!allowedTypes.includes(file.type)) {
        return false;
      }
      if (file.size > maxFileSize) {
        return false;
      }
      return true;
    },
    [allowedTypes, maxFileSize]
  );

  const processFiles = useCallback(
    (files) => {
      const validFiles = Array.from(files).filter(validateFile);
      const invalidCount = files.length - validFiles.length;

      if (invalidCount > 0) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        const allowedTypesText = allowedTypes
          .map((type) => type.split("/")[1].toUpperCase())
          .join(", ");
        setMessage({
          type: "error",
          text: `Alguns arquivos foram rejeitados. Apenas imagens ${allowedTypesText} até ${maxSizeMB}MB são permitidas.`,
        });
      }

      setSelectedImages((prev) => {
        const newImages = validFiles.filter(
          (file) => !prev.find((img) => img.name === file.name)
        );
        return [...prev, ...newImages];
      });
    },
    [validateFile, maxFileSize, allowedTypes]
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
      const files = e.dataTransfer.files;
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = e.target.files;
      processFiles(files);
    },
    [processFiles]
  );

  const removeImage = useCallback((index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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
    e.dataTransfer.setData("text/html", e.target.outerHTML);
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

  const uploadImages = async (propertyName) => {
    try {
      setIsUploading(true);
      setProgress(0);
      setProgressText("Preparando upload...");
      setMessage({ type: "", text: "" });

      // Verifica se a URL está correta
      if (
        !webhookUrl ||
        webhookUrl.includes("{{WEBHOOK_URL}}") ||
        webhookUrl.includes("seu-dominio.com")
      ) {
        throw new Error(
          "URL do formulário não configurada corretamente. Verifique as variáveis de ambiente na Vercel."
        );
      }

      const batchSize = 5; // Tamanho do lote
      const totalBatches = Math.ceil(selectedImages.length / batchSize);
      let successfulUploads = 0;
      let failedUploads = 0;

      setProgressText(`Iniciando upload em ${totalBatches} lote(s)...`);

      // Delay inicial para o primeiro lote (servidor "aquecer")
      if (totalBatches > 1) {
        setProgressText("Preparando servidor...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Processa cada lote
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(
          startIndex + batchSize,
          selectedImages.length
        );
        const batchImages = selectedImages.slice(startIndex, endIndex);

        setProgressText(
          `Enviando lote ${batchIndex + 1}/${totalBatches} (${
            batchImages.length
          } imagens)...`
        );

        // Sistema de retry para lotes que falharem
        let batchSuccess = false;
        let retryCount = 0;
        const maxRetries = 2;

        while (!batchSuccess && retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(
                `Tentativa ${retryCount + 1} para o lote ${batchIndex + 1}...`
              );
              setProgressText(
                `Tentativa ${retryCount + 1} - Lote ${
                  batchIndex + 1
                }/${totalBatches} (${batchImages.length} imagens)...`
              );
              // Pausa maior entre tentativas
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            const formData = new FormData();

            // Adiciona as imagens do lote atual
            batchImages.forEach((file, index) => {
              formData.append("Fotos", file);
              console.log(
                `Adicionando imagem ${startIndex + index + 1}: ${file.name} (${
                  file.size
                } bytes)`
              );
            });

            // Adiciona informações do lote
            formData.append("Nome da Propriedade (Apelido)", propertyName);
            formData.append("batchNumber", batchIndex + 1);
            formData.append("totalBatches", totalBatches);
            formData.append("imagesInBatch", batchImages.length);
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
              successfulUploads += batchImages.length;
              console.log(`Lote ${batchIndex + 1} enviado com sucesso!`);
              batchSuccess = true;
            } else {
              const errorText = await response.text();
              console.error(
                `Erro no lote ${batchIndex + 1} (tentativa ${retryCount + 1}):`,
                errorText
              );

              if (retryCount === maxRetries) {
                failedUploads += batchImages.length;
                setMessage({
                  type: "error",
                  text: `Erro no lote ${batchIndex + 1} após ${
                    maxRetries + 1
                  } tentativas. Continuando com os próximos lotes...`,
                });
              }
            }
          } catch (error) {
            console.error(
              `Erro no lote ${batchIndex + 1} (tentativa ${retryCount + 1}):`,
              error
            );

            if (retryCount === maxRetries) {
              failedUploads += batchImages.length;
              setMessage({
                type: "error",
                text: `Erro no lote ${batchIndex + 1} após ${
                  maxRetries + 1
                } tentativas. Continuando com os próximos lotes...`,
              });
            }
          }

          retryCount++;
        }

        // Atualiza o progresso
        const progressPercent = ((batchIndex + 1) / totalBatches) * 100;
        setProgress(progressPercent);

        // Pequena pausa entre lotes para evitar sobrecarga
        if (batchIndex < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Resultado final
      if (failedUploads === 0) {
        setProgress(100);
        setProgressText(
          `Todas as ${selectedImages.length} imagens enviadas com sucesso em ${totalBatches} lote(s)!`
        );
        setMessage({
          type: "success",
          text: `Upload concluído! ${successfulUploads} imagens enviadas com sucesso.`,
        });

        // Reset form after success
        setTimeout(() => {
          setSelectedImages([]);
          setPropertyName("");
          setProgress(0);
          setProgressText("");
          setMessage({ type: "", text: "" });
        }, 3000);
      } else if (successfulUploads > 0) {
        setProgress(100);
        setProgressText("Upload parcialmente concluído");
        setMessage({
          type: "error",
          text: `Upload parcial: ${successfulUploads} imagens enviadas, ${failedUploads} falharam. Tente novamente com as imagens que falharam.`,
        });
      } else {
        setProgress(0);
        setProgressText("");
        setMessage({
          type: "error",
          text: "Falha no upload de todos os lotes. Verifique sua conexão e tente novamente.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Erro ao enviar imagens. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setIsUploading(false);
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
    selectedImages.length > 0 && propertyName.trim() !== "" && !isUploading;

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
          className={`upload-area ${isDragOver ? "dragover" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-cloud-upload-alt text-6xl text-primary-400 mb-4 block transition-all duration-300 hover:text-secondary-400 hover:scale-110"></i>
          <p className="text-xl font-bold text-white mb-2">
            Clique aqui ou arraste as imagens
          </p>
          <p className="text-white/70">
            PNG, JPG, JPEG até {Math.round(maxFileSize / (1024 * 1024))}MB cada
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
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
            {selectedImages.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
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
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-24 object-cover"
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-110 z-20"
                >
                  x
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-white/70 text-sm">{progressText}</p>
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
