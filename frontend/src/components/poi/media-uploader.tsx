"use client";

import { Camera, Mic, Square, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MediaType } from "@/types/poi";

export interface PendingMedia {
  id: string;
  file: File | Blob;
  filename: string;
  contentType: string;
  mediaType: MediaType;
  previewUrl: string;
}

interface MediaUploaderProps {
  value: PendingMedia[];
  onChange: (items: PendingMedia[]) => void;
}

export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const addImageFiles = (files: FileList | null) => {
    if (!files) return;
    const items: PendingMedia[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      contentType: file.type,
      mediaType: file.type === "image/gif" ? "gif" : "image",
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...value, ...items]);
  };

  const addAudioFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        file,
        filename: file.name,
        contentType: file.type,
        mediaType: "audio",
        previewUrl: URL.createObjectURL(file),
      },
    ]);
  };

  const removeItem = (id: string) => onChange(value.filter((item) => item.id !== id));

  const startRecording = async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        onChange([
          ...value,
          {
            id: crypto.randomUUID(),
            file: blob,
            filename: `gravacao-${Date.now()}.webm`,
            contentType: "audio/webm",
            mediaType: "audio",
            previewUrl: URL.createObjectURL(blob),
          },
        ]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordError("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addImageFiles(event.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground hover:bg-muted/60"
      >
        <Upload className="size-4" />
        Arraste ou clique para enviar imagem/GIF
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => addImageFiles(event.target.files)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
        >
          <Camera className="size-3.5" />
          Tirar foto
        </button>
        {/* `capture="environment"` abre a câmera traseira direto no mobile
            (iOS/Android) em vez do seletor genérico de arquivo/galeria —
            input separado do de cima porque o atributo não é removível em
            runtime nem combinável com `multiple`. */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => addImageFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs ${
            isRecording ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
          }`}
        >
          {isRecording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
          {isRecording ? "Parar gravação" : "Gravar áudio"}
        </button>
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
        >
          Enviar áudio
        </button>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => addAudioFile(event.target.files)}
        />
      </div>
      {recordError && <p className="text-xs text-destructive">{recordError}</p>}

      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs"
            >
              {item.mediaType === "image" || item.mediaType === "gif" ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local (blob URL), não é mídia hospedada
                <img
                  src={item.previewUrl}
                  alt={item.filename}
                  className="size-9 shrink-0 rounded object-cover"
                />
              ) : (
                <audio
                  src={item.previewUrl}
                  controls
                  className="h-8 w-36 shrink-0"
                />
              )}
              <span className="min-w-0 flex-1 truncate text-foreground">{item.filename}</span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remover ${item.filename}`}
                    />
                  }
                >
                  <Trash2 className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>Remover arquivo</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
