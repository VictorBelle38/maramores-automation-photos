import React from "react";
import ImageUploader from "./components/ImageUploader";

function App() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-500/5 rounded-full blur-2xl animate-bounce-gentle"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="glass-card pt-12 pb-8 px-8 md:pt-16 md:pb-12 md:px-12 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4 animate-slide-up">
              UPLOAD DE IMAGENS
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full animate-pulse-glow"></div>
            <p className="text-white/70 mt-4 text-lg">
              Interface moderna para envio de imagens com integração n8n
            </p>
          </div>

          {/* Main Component */}
          <ImageUploader />
        </div>
      </div>
    </div>
  );
}

export default App;
