import { useState, useEffect } from "react";
import { useRouter } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./filter-bar";
import { Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchToolsProps {
  initialQuery?: string;
  initialLocation?: string;
  onSearch: (params: { query?: string; location?: string }) => void;
}

export function SearchTools({ 
  initialQuery = "", 
  initialLocation = "",
  onSearch 
}: SearchToolsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const { toast } = useToast();
  
  // Update inputs when URL params change
  useEffect(() => {
    setQuery(initialQuery);
    setLocation(initialLocation);
  }, [initialQuery, initialLocation]);

  const handleSearch = () => {
    console.log("Iniciando busca com parâmetros:", { query, location });
    onSearch({ query, location });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleUseCurrentLocation = () => {
    // Solicitar ao usuário que insira manualmente a localização
    toast({
      description: "Insira sua cidade e estado manualmente (ex: São Paulo, SP)",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-dark-light h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar freelancers por habilidade ou nome"
            className="w-full pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {/* Location Input */}
        <div className="relative w-full md:w-64">
          <MapPin className="absolute left-3 top-3 text-dark-light h-4 w-4" />
          <Input 
            type="text" 
            placeholder="Localização" 
            className="w-full pl-10"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={handleUseCurrentLocation}
          />
        </div>
        
        {/* Search Button */}
        <Button onClick={handleSearch}>
          Buscar
        </Button>
      </div>
      
      <FilterBar onFilterChange={(filters) => {
        console.log("Aplicando filtros:", filters);
        
        // Atualizar a URL com os filtros aplicados
        const params = new URLSearchParams(window.location.search);
        
        // Adicionar ou remover parâmetros de filtro
        if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
        else params.delete('minPrice');
        
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
        else params.delete('maxPrice');
        
        if (filters.rating) params.set('rating', filters.rating.toString());
        else params.delete('rating');
        
        if (filters.distance) params.set('distance', filters.distance.toString());
        else params.delete('distance');
        
        if (filters.category) params.set('category', filters.category);
        else params.delete('category');
        
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        else params.delete('sortBy');
        
        // Resetar para a primeira página
        params.delete('page');
        
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        
        // Em vez de usar window.location.href, que causa um recarregamento completo da página,
        // atualizar a URL sem recarregar e disparar um evento personalizado
        window.history.pushState({}, '', `/${newSearch}`);
        
        // Disparar um evento personalizado para notificar outros componentes
        const event = new CustomEvent('filtersChanged', { detail: filters });
        window.dispatchEvent(event);
      }} />
    </div>
  );
}
