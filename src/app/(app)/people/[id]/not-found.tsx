import { UserX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function MemberNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <UserX className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">Perfil no encontrado</h2>
      <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">Este perfil no existe en la población actual o usted no tiene acceso a él.</p>
      <Link href="/people" className={buttonClasses("secondary", "md", "mt-6")}>
        Volver a Inteligencia de Personas
      </Link>
    </div>
  );
}
