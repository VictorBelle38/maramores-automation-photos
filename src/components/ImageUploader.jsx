import React, { useCallback, useRef, useState } from "react";

const ImageUploader = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [propertyName, setPropertyName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const webhookUrl =
    window.WEBHOOK_URL || "https://n8n.remotedok.fun/webhook/envio-fotos";
  const maxFileSize = window.MAX_FILE_SIZE || 10 * 1024 * 1024;
  const allowedTypes = window.ALLOWED_TYPES || [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

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

      const formData = new FormData();

      // Adiciona todas as imagens
      selectedImages.forEach((file, index) => {
        formData.append("Fotos", file);
        console.log(
          `Adicionando imagem ${index + 1}: ${file.name} (${file.size} bytes)`
        );
      });

      // Adiciona o nome da propriedade
      formData.append("Nome da Propriedade (Apelido)", propertyName);
      formData.append("totalImages", selectedImages.length);
      formData.append("uploadTimestamp", new Date().toISOString());

      setProgressText("Enviando imagens...");
      setProgress(50);

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setProgress(100);
        setProgressText(
          `Todas as ${selectedImages.length} imagens enviadas com sucesso!`
        );
        setMessage({ type: "success", text: "Imagens enviadas com sucesso!" });

        // Reset form after success
        setTimeout(() => {
          setSelectedImages([]);
          setPropertyName("");
          setProgress(0);
          setProgressText("");
          setMessage({ type: "", text: "" });
        }, 2000);
      } else {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
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
          <h3 className="text-lg font-semibold text-white">
            Imagens Selecionadas ({selectedImages.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedImages.map((file, index) => (
              <div key={index} className="image-card group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
                >
                  ×
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
