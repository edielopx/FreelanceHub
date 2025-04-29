import { Skeleton } from "@/components/ui/skeleton";

export function JobDetailSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 sm:w-96" /> {/* Título */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-24" /> {/* Data */}
            <Skeleton className="h-6 w-20 rounded-full" /> {/* Status */}
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-md mt-4 sm:mt-0" /> {/* Botão */}
      </div>
      
      {/* Detalhes principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Descrição */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" /> {/* Título "Descrição" */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          {/* Detalhes do contato */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" /> {/* Título "Informações de contato" */}
            <Skeleton className="h-5 w-64" /> {/* Email */}
            <Skeleton className="h-5 w-48" /> {/* Telefone */}
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Detalhes do projeto */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-48" /> {/* Título "Detalhes do projeto" */}
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" /> {/* Título "Orçamento" */}
                <Skeleton className="h-5 w-28" /> {/* Valor */}
              </div>
              
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" /> {/* Título "Prazo" */}
                <Skeleton className="h-5 w-32" /> {/* Valor */}
              </div>
              
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" /> {/* Título "Categoria" */}
                <Skeleton className="h-5 w-36" /> {/* Valor */}
              </div>
              
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" /> {/* Título "Localização" */}
                <Skeleton className="h-5 w-40" /> {/* Valor */}
              </div>
            </div>
          </div>
          
          {/* Cliente */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" /> {/* Título "Cliente" */}
            <div className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" /> {/* Avatar */}
              <div>
                <Skeleton className="h-5 w-36" /> {/* Nome */}
                <Skeleton className="h-4 w-28" /> {/* Membro desde */}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Propostas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" /> {/* Título "Propostas" */}
          <Skeleton className="h-10 w-40 rounded-md" /> {/* Botão */}
        </div>
        
        {/* Lista de propostas */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" /> {/* Avatar */}
              <div>
                <Skeleton className="h-5 w-36" /> {/* Nome */}
                <Skeleton className="h-4 w-28" /> {/* Data */}
              </div>
              <div className="ml-auto flex items-center space-x-2">
                <Skeleton className="h-6 w-24" /> {/* Preço */}
                <Skeleton className="h-6 w-28" /> {/* Prazo */}
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" /> {/* Proposta */}
              <Skeleton className="h-4 w-full" /> {/* Proposta continuação */}
              <Skeleton className="h-4 w-3/4" /> {/* Proposta continuação */}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-9 w-24 rounded-md" /> {/* Botão */}
              <Skeleton className="h-9 w-24 rounded-md" /> {/* Botão */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}