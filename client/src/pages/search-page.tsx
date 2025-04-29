import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SearchTools } from "@/components/search/search-tools";
import { FilterBar, FilterOptions } from "@/components/search/filter-bar";
import { FreelancerCard } from "@/components/freelancer/freelancer-card";
import { FreelancerCardSkeleton } from "@/components/freelancer/freelancer-card-skeleton";
import { useToast } from "@/hooks/use-toast";
import { FreelancerWithDetails } from "@shared/schema";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function SearchPage() {
  const { toast } = useToast();
  const [path, search] = useLocation();
  
  // Parse search parameters
  const searchParams = new URLSearchParams(search);
  const query = searchParams.get('query') || '';
  const locationParam = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || undefined;
  const maxPrice = searchParams.get('maxPrice') || undefined;
  const rating = searchParams.get('rating') || undefined;
  const distance = searchParams.get('distance') || undefined;
  const sortBy = searchParams.get('sortBy') || undefined;
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const pageSize = 4;
  
  // Estado local para filtros
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    rating: rating ? Number(rating) : undefined,
    distance: distance ? Number(distance) : undefined,
    category,
    sortBy
  });
  
  // Fetch freelancers
  const { data: freelancers = [], isLoading, refetch } = useQuery<FreelancerWithDetails[]>({
    queryKey: ['/api/freelancers', { 
      query, 
      location: locationParam, 
      ...filters
    }],
  });
  
  // Log para depuração da ordenação
  useEffect(() => {
    if (freelancers.length > 0 && sortBy) {
      console.log("DEBUG - Ordenação dos freelancers:");
      for (let i = 0; i < Math.min(5, freelancers.length); i++) {
        console.log(`${i+1}. ${freelancers[i].user.name} - R$${freelancers[i].profile.hourlyRate}/h`);
      }
    }
  }, [freelancers, sortBy]);
  
  // Escutar o evento personalizado 'filtersChanged'
  useEffect(() => {
    const handleFiltersChanged = (event: CustomEvent) => {
      console.log("Detectada mudança nos filtros:", event.detail);
      
      // Atualizar os filtros locais com os valores do evento
      setFilters(prevFilters => ({
        ...prevFilters,
        ...event.detail
      }));
      
      // Recarregar os dados quando o evento for acionado
      refetch();
    };
    
    // Adicionar listener para o evento personalizado
    window.addEventListener('filtersChanged', handleFiltersChanged as EventListener);
    
    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('filtersChanged', handleFiltersChanged as EventListener);
    };
  }, [refetch]);
  
  // Calculate pagination
  const totalPages = Math.ceil(freelancers.length / pageSize);
  const paginatedFreelancers = freelancers.slice((page - 1) * pageSize, page * pageSize);
  
  // Função para manipular a busca
  const handleSearch = (params: { query?: string; location?: string }) => {
    console.log("Realizando busca com parâmetros:", params);
    
    // Preservar os parâmetros de filtro atuais
    const newParams = new URLSearchParams(window.location.search);
    
    if (params.query) newParams.set('query', params.query);
    else newParams.delete('query');
    
    if (params.location) newParams.set('location', params.location);
    else newParams.delete('location');
    
    // Resetar para a primeira página quando fizer uma nova busca
    newParams.delete('page');
    
    const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
    
    // Atualizar a URL sem recarregar a página
    window.history.pushState({}, '', `/${newSearch}`);
    
    // Refazer a busca com os novos parâmetros
    refetch();
  };
  
  // Função para manipular a mudança de filtros
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    
    // Atualizar a URL com os novos filtros
    const newParams = new URLSearchParams();
    
    // Preservar query e location
    if (query) newParams.set('query', query);
    if (locationParam) newParams.set('location', locationParam);
    
    // Adicionar novos filtros
    if (newFilters.minPrice) newParams.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) newParams.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.rating) newParams.set('rating', newFilters.rating.toString());
    if (newFilters.distance) newParams.set('distance', newFilters.distance.toString());
    if (newFilters.category) newParams.set('category', newFilters.category);
    if (newFilters.sortBy) newParams.set('sortBy', newFilters.sortBy);
    
    // Redefinir para a primeira página
    newParams.delete('page');
    
    // Atualizar a URL sem recarregar a página
    const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
    window.history.pushState({}, '', `/${newSearch}`);
    
    // Refazer a pesquisa com os novos filtros
    refetch();
  };
  
  // Função para lidar com mudança de página
  const handlePageChange = (pageNum: number) => {
    console.log("Mudando para página:", pageNum);
    
    // Atualizar a variável de estado local
    setPage(pageNum);
    
    const newParams = new URLSearchParams();
    
    // Adicionar parâmetros de busca e filtros
    if (query) newParams.set('query', query);
    if (locationParam) newParams.set('location', locationParam);
    if (filters.minPrice) newParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.rating) newParams.set('rating', filters.rating.toString());
    if (filters.distance) newParams.set('distance', filters.distance.toString());
    if (filters.category) newParams.set('category', filters.category);
    if (filters.sortBy) newParams.set('sortBy', filters.sortBy);
    
    // Definir a página
    newParams.set('page', pageNum.toString());
    
    // Atualizar a URL sem recarregar a página
    const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
    window.history.pushState({}, '', `/${newSearch}`);
    
    // Não precisamos fazer um refetch porque 
    // a paginação é realizada no cliente com os dados atuais
    // (paginatedFreelancers = freelancers.slice(...))
  };
  
  // Construir URLs para paginação (mantido para compatibilidade com os componentes)
  const buildPaginationUrl = (pageNum: number) => {
    return "#" + pageNum; // URL fictícia para o atributo href
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 pt-16 lg:pt-0">
          <SearchTools 
            initialQuery={query} 
            initialLocation={locationParam}
            onSearch={handleSearch}
          />
          
          <div className="space-y-4 mt-4">
            <h2 className="text-xl font-semibold text-dark">
              Freelancers disponíveis ({freelancers.length})
            </h2>
            
            {isLoading ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {Array.from({ length: 4 }).map((_, i) => (
                  <FreelancerCardSkeleton key={i} />
                ))}
              </div>
            ) : freelancers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum freelancer encontrado</h3>
                <p className="text-gray-500">
                  Tente ajustar seus filtros ou buscar por outros termos.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {paginatedFreelancers.map((freelancer, index) => (
                  <div key={freelancer.user.id} 
                       className="animate-in fade-in-50 duration-300"
                       style={{ animationDelay: `${index * 75}ms` }}>
                    <FreelancerCard freelancer={freelancer} />
                  </div>
                ))}
                
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            href={buildPaginationUrl(page - 1)} 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page - 1);
                            }} 
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href={buildPaginationUrl(i + 1)}
                            isActive={page === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {page < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            href={buildPaginationUrl(page + 1)} 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page + 1);
                            }}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
