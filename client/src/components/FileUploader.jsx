import React, { useState } from 'react';

const FileUploader = ({ onFileSelect }) => {
    const [file, setFile] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                onFileSelect?.(selectedFile);
            }
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                onFileSelect?.(selectedFile);
            }
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setFile(null);
        onFileSelect?.(null);
    };

    const formatSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div 
            className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragActive ? "border-brand-orange bg-brand-orange/10" : "border-gray-300 hover:border-gray-400 bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                id="uploader-input" 
                className="hidden" 
                accept=".pdf" 
                onChange={handleChange} 
            />
            {file ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/images/pdf.png" alt="pdf" className="w-10 h-10 object-contain" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleClear} 
                        className="p-1 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <img src="/icons/cross.svg" alt="remove" className="w-5 h-5 opacity-60 hover:opacity-100" />
                    </button>
                </div>
            ) : (
                <label htmlFor="uploader-input" className="cursor-pointer block space-y-3">
                    <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <img src="/icons/info.svg" alt="upload" className="w-8 h-8 filter brightness-0 invert" style={{ filter: "invert(42%) sepia(93%) saturate(1352%) hue-rotate(346deg) brightness(101%) contrast(101%)" }} />
                    </div>
                    <div>
                        <p className="text-base text-gray-700 font-medium">
                            <span className="text-brand-orange hover:underline">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF format only (Max 20MB)</p>
                    </div>
                </label>
            )}
        </div>
    );
};

export default FileUploader;
