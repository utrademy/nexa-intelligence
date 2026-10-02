"use client";

import { AlertCircle, Check, CloudUpload, FileText, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { KnowledgeArea, KnowledgeAreaId, KnowledgeDocument } from "@/lib/types";
import { cn } from "@/lib/format";

interface SelectedFile {
  file: File;
  name: string;
  size: string;
  format: "PDF";
}

const PIPELINE = ["Subiendo", "Extrayendo texto", "Fragmentando e indexando", "Indexado"];

function toSelected(file: File): SelectedFile | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf") return null;
  const kb = file.size / 1024;
  return {
    file,
    name: file.name,
    size:
      kb > 1024
        ? `${(kb / 1024).toFixed(1).replace(".", ",")} MB`
        : `${Math.max(1, Math.round(kb))} KB`,
    format: "PDF",
  };
}

export function UploadModal({
  open,
  onClose,
  areas,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  areas: KnowledgeArea[];
  onUploaded: (docs: KnowledgeDocument[]) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<KnowledgeAreaId>("labor-law");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const file = list[0];
    const item = toSelected(file);
    if (!item) {
      setError("Solo se admiten documentos en formato PDF en esta fase.");
      return;
    }
    setError(null);
    setSelectedFile(item);
    if (!title) {
      setTitle(item.name.replace(/\.pdf$/i, ""));
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setTitle("");
    setSource("");
    setDescription("");
    setPhase(-1);
    setError(null);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setError(null);
    setPhase(0); // Subiendo

    const timer1 = setTimeout(() => setPhase(1), 1200); // Extrayendo
    const timer2 = setTimeout(() => setPhase(2), 2400); // Indexando

    try {
      const finalSource =
        source.trim() ||
        (area === "sergio-flores" ? "Sergio Flórez & Abogados" : "Documento cargado");

      const formData = new FormData();
      formData.append("file", selectedFile.file);
      formData.append("title", title || selectedFile.name.replace(/\.pdf$/i, ""));
      if (description) formData.append("description", description);
      formData.append("area", area);
      formData.append("sourceName", finalSource);

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Error al indexar el documento.");
      }

      setPhase(3); // Indexado

      if (json.document) {
        onUploaded([json.document]);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setPhase(-1);
      setError(err?.message || "No fue posible indexar el documento.");
    }
  };

  const done = phase === PIPELINE.length - 1;
  const processing = phase >= 0 && !done;

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Agregar conocimiento especializado"
      subtitle="Cargue documentos jurídicos o metodológicos en PDF para indexarlos en la base de conocimiento vectorial."
      icon={<CloudUpload className="h-5 w-5 text-indigo-600" />}
      footer={
        <>
          <span className="text-[12px] text-slate-400">PDF con texto · hasta 50 MB</span>
          <div className="flex gap-2">
            {done ? (
              <Button onClick={close}>Listo</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={close} disabled={processing}>
                  Cancelar
                </Button>
                <Button variant="ai" onClick={startUpload} disabled={!selectedFile || processing}>
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Indexando…
                    </>
                  ) : (
                    "Indexar documento"
                  )}
                </Button>
              </>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-[13px] text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {phase === -1 && (
          <>
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                  dragging
                    ? "border-indigo-400 bg-indigo-50/60"
                    : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                  <CloudUpload className="h-6 w-6" />
                </div>
                <div className="mt-4 text-[14px] font-semibold text-slate-900">
                  Arrastre un archivo PDF aquí o haga clic para seleccionarlo
                </div>
                <div className="mt-1 text-[12.5px] text-slate-500">
                  Políticas internas, guías metodológicas, circulares o normas colombianas
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  hidden
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[11px] font-bold text-rose-600">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-slate-900">
                      {selectedFile.name}
                    </div>
                    <div className="text-[12px] text-slate-400">{selectedFile.size}</div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Quitar archivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-slate-700">
                      Título en el Centro de Conocimiento
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nombre del documento..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-slate-700">
                      Fuente u origen del documento (opcional)
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder={
                        area === "sergio-flores"
                          ? "Sergio Flórez & Abogados"
                          : "Ej: Ministerio del Trabajo, Diario Oficial, Documento cargado..."
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-slate-700">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Alcance, objetivo o contexto del documento..."
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-[12.5px] font-medium text-slate-700">
                      Área de conocimiento
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {areas.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setArea(a.id)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-medium transition",
                            area === a.id
                              ? "border-indigo-400 bg-indigo-50/50 text-indigo-800 ring-4 ring-indigo-500/10"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {phase >= 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
              Proceso de incorporación y vectorización RAG
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PIPELINE.map((p, i) => (
                <div key={p} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition",
                      i < phase || done
                        ? "bg-emerald-500 text-white"
                        : i === phase
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-white text-slate-300 ring-1 ring-slate-200"
                    )}
                  >
                    {i < phase || done ? (
                      <Check className="h-4 w-4" />
                    ) : i === phase ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-[11px] font-semibold">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[11.5px] font-medium",
                      i <= phase ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {p}
                  </span>
                </div>
              ))}
            </div>
            {done && (
              <div className="mt-4 animate-slide-up rounded-lg bg-emerald-50 px-3.5 py-3 text-[12.5px] text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
                Documento indexado con éxito en <b>{areas.find((a) => a.id === area)?.name}</b>. Sus fragmentos y vectores ya están disponibles para búsqueda semántica en <b>NEXA Laboral AI</b>.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
