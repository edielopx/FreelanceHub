import { Skeleton } from "@/components/ui/skeleton";

export function FreelancerProfileSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho com avatar e informações básicas */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
        
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" /> {/* Nome */}
          <Skeleton className="h-6 w-full max-w-md" /> {/* Título */}
          
          <div className="flex items-center space-x-4">
            <Skeleton className="h-5 w-24" /> {/* Avaliação */}
            <Skeleton className="h-5 w-20" /> {/* Preço */}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Seção sobre */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" /> {/* Título "Sobre" */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      
      {/* Experiência */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" /> {/* Título "Experiência" */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      
      {/* Serviços */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" /> {/* Título "Serviços" */}
        
        {/* Cards de serviço */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-48" /> {/* Nome do serviço */}
            <Skeleton className="h-4 w-full" /> {/* Descrição */}
            <Skeleton className="h-4 w-5/6" /> {/* Descrição continuação */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" /> {/* Preço */}
              <Skeleton className="h-9 w-32 rounded-md" /> {/* Botão */}
            </div>
          </div>
        ))}
      </div>
      
      {/* Avaliações */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" /> {/* Título "Avaliações" */}
        
        {/* Cards de avaliação */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar */}
              <div>
                <Skeleton className="h-5 w-32" /> {/* Nome */}
                <Skeleton className="h-4 w-24" /> {/* Data */}
              </div>
              <div className="ml-auto">
                <Skeleton className="h-4 w-24" /> {/* Avaliação */}
              </div>
            </div>
            <Skeleton className="h-4 w-full" /> {/* Comentário */}
            <Skeleton className="h-4 w-3/4" /> {/* Comentário continuação */}
          </div>
        ))}
      </div>
    </div>
  );
}