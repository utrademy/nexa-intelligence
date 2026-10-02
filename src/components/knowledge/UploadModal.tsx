"use client";

import { Check, CloudUpload, FileText, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { KnowledgeArea, KnowledgeAreaId, KnowledgeDocument } from "@/lib/types";
import { cn } from "@/lib/format";

interface PendingFile {
  name: string;
  size: string;
  format: "PDF" | "DOCX";
}

const SAMPLE_FILES: PendingFile[] = [
  { name: "Circular 0021 de 2026 — Ministerio del Trabajo.pdf", size: "1,8 MB", format: "PDF" },
  { name: "Procedimiento interno de ajustes razonables v2.docx", size: "420 KB", format: "DOCX" },
];

const PIPELINE = ["Cargando", "Extrayendo texto", "Fragmentando e indexando", "Indexado"];

function toPending(file: File): PendingFile | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx") return null;
  const kb = file.size / 1024;
  return { name: file.name, size: kb > 1024 ? `${(kb / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(kb))} KB`, format: ext === "pdf" ? "PDF" : "DOCX" };
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
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [area, setArea] = useState<KnowledgeAreaId>("labor-law");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).map(toPending).filter((f): f is PendingFile => !!f);
    setFiles((prev) => [...prev, ...accepted]);
  };

  const reset = () => {
    setFiles([]);
    setPhase(-1);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const start = () => {
    setPhase(0);
    PIPELINE.forEach((_, i) => {
      if (i > 0) setTimeout(() => setPhase(i), 900 * i);
    });
    setTimeout(() => {
      onUploaded(
        files.map((f, i) => ({
          id: `up-${Date.now()}-${i}`,
          title: f.name.replace(/\.(pdf|docx)$/i, ""),
          area,
          source: "Cargado por Laura Mantilla",
          format: f.format,
          pages: 12 + i * 7,
          lastUpdated: "2026-10-02",
          status: i === 0 ? "Procesando" : "Requiere revisión",
        })),
      );
    }, 900 * PIPELINE.length);
  };

  const done = phase === PIPELINE.length - 1;
  const processing = phase >= 0 && !done;

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Agregar conocimiento"
      subtitle="Cargue documentos autorizados para alimentar NEXA Laboral AI."
      icon={<CloudUpload className="h-5 w-5" />}
      footer={
        <>
          <span className="text-[12px] text-slate-400">PDF y DOCX · hasta 50 MB por archivo</span>
          <div className="flex gap-2">
            {done ? (
              <Button onClick={close}>Listo</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={close} disabled={processing}>
                  Cancelar
                </Button>
                <Button variant="ai" onClick={start} disabled={files.length === 0 || processing}>
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando…
                    </>
                  ) : (
                    `Cargar ${files.length || ""} documento${files.length === 1 ? "" : "s"}`
                  )}
                </Button>
              </>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-5">
        {phase === -1 && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                dragging ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <CloudUpload className="h-6 w-6" />
              </div>
              <div className="mt-4 text-[14px] font-semibold text-slate-900">Arrastre archivos aquí o haga clic para seleccionarlos</div>
              <div className="mt-1 text-[12.5px] text-slate-500">PDF o DOCX: leyes, decretos, políticas internas, guías y metodologías especializadas</div>
              <input ref={inputRef} type="file" accept=".pdf,.docx" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </div>
            {files.length === 0 && (
              <button onClick={() => setFiles(SAMPLE_FILES)} className="text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700">
                Usar documentos de ejemplo para la demostración →
              </button>
            )}
          </>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-bold", f.format === "PDF" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600")}>
                  {f.format === "PDF" ? "PDF" : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-800">{f.name}</div>
                  {phase >= 0 ? (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-cyan-500 transition-[width] duration-700" style={{ width: `${((phase + 1) / PIPELINE.length) * 100}%` }} />
                    </div>
                  ) : (
                    <div className="text-[11.5px] text-slate-400">{f.size}</div>
                  )}
                </div>
                {phase === -1 && (
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Quitar">
                    <X className="h-4 w-4" />
                  </button>
                )}
                {done && <Check className="h-4 w-4 text-emerald-500" />}
              </div>
            ))}
          </div>
        )}

        {phase === -1 ? (
          <div>
            <div className="mb-2 text-[13px] font-medium text-slate-700">Área de conocimiento</div>
            <div className="grid grid-cols-2 gap-2">
              {areas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setArea(a.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition",
                    area === a.id ? "border-indigo-400 bg-indigo-50/50 text-indigo-800 ring-4 ring-indigo-500/10" : "border-slate-200 text-slate-600 hover:border-slate-300",
                  )}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-400">Proceso de incorporación con IA</div>
            <div className="grid grid-cols-4 gap-2">
              {PIPELINE.map((p, i) => (
                <div key={p} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition",
                      i < phase || done ? "bg-emerald-500 text-white" : i === phase ? "bg-indigo-100 text-indigo-600" : "bg-white text-slate-300 ring-1 ring-slate-200",
                    )}
                  >
                    {i < phase || done ? <Check className="h-4 w-4" /> : i === phase ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-[11px] font-semibold">{i + 1}</span>}
                  </span>
                  <span className={cn("text-[11.5px] font-medium", i <= phase ? "text-slate-700" : "text-slate-400")}>{p}</span>
                </div>
              ))}
            </div>
            {done && (
              <div className="mt-4 animate-slide-up rounded-lg bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
                Documentos agregados a <b>{areas.find((a) => a.id === area)?.name}</b>. Alimentarán las respuestas de NEXA Laboral AI una vez finalice su revisión.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
