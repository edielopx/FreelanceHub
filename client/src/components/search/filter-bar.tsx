import { useState, useEffect } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, List, SortDesc, X } from "lucide-react";
import { Rating } from "@/components/ui/rating";

export interface FilterBarProps {
  onFilterChange?: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  distance?: number;
  category?: string;
  sortBy?: string;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [viewType, setViewType] = useState<"list">("list");
  const [activeFilters, setActiveFilters] = useState<Array<{id: string, label: string}>>([]);
  
  // Filter states
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  
  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Set filter states from URL params
    if (params.has("minPrice")) setMinPrice(params.get("minPrice") || "");
    if (params.has("maxPrice")) setMaxPrice(params.get("maxPrice") || "");
    if (params.has("rating")) setRating(Number(params.get("rating")) || null);
    if (params.has("distance")) setDistance(params.get("distance") || "");
    if (params.has("category")) setCategory(params.get("category") || "");
    if (params.has("sortBy")) setSortBy(params.get("sortBy") || "");
    
    // Build active filters array
    const filters: Array<{id: string, label: string}> = [];
    
    if (params.has("minPrice") || params.has("maxPrice")) {
      const min = params.get("minPrice") || "0";
      const max = params.get("maxPrice") || "∞";
      filters.push({ id: "price", label: `Preço: R$${min}-${max}` });
    }
    
    if (params.has("rating")) {
      const ratingValue = params.get("rating") || "";
      filters.push({ id: "rating", label: `${ratingValue}★ ou mais` });
    }
    
    if (params.has("distance")) {
      const distanceValue = params.get("distance") || "";
      filters.push({ id: "distance", label: `Até ${distanceValue}km` });
    }
    
    if (params.has("category")) {
      const categoryValue = params.get("category") || "";
      const categoryLabels: Record<string, string> = {
        "development": "Desenvolvimento",
        "design": "Design",
        "marketing": "Marketing",
        "writing": "Redação",
        "photography": "Fotografia"
      };
      filters.push({ id: "category", label: categoryLabels[categoryValue] || categoryValue });
    }
    
    if (params.has("sortBy")) {
      const sortValue = params.get("sortBy") || "";
      const sortLabels: Record<string, string> = {
        "rating": "Melhor avaliados",
        "price_asc": "Menor preço",
        "price_desc": "Maior preço",
        "distance": "Mais próximos"
      };
      filters.push({ id: "sort", label: `Ordenar: ${sortLabels[sortValue] || sortValue}` });
    }
    
    setActiveFilters(filters);
  }, [window.location.search]);
  
  const handleRemoveFilter = (id: string) => {
    // Remove filter from active filters
    setActiveFilters(prev => prev.filter(filter => filter.id !== id));
    
    // Reset corresponding state
    switch (id) {
      case "price":
        setMinPrice("");
        setMaxPrice("");
        break;
      case "rating":
        setRating(null);
        break;
      case "distance":
        setDistance("");
        break;
      case "category":
        setCategory("");
        break;
      case "sort":
        setSortBy("");
        break;
    }
    
    if (onFilterChange) {
      // Preparar os filtros atualizados
      let updatedFilters: FilterOptions = {};
      
      // Manter todos os filtros que não foram removidos
      if (id !== "price") {
        updatedFilters.minPrice = minPrice ? parseInt(minPrice) : undefined;
        updatedFilters.maxPrice = maxPrice ? parseInt(maxPrice) : undefined;
      }
      
      if (id !== "rating") {
        updatedFilters.rating = rating ?? undefined;
      }
      
      if (id !== "distance") {
        updatedFilters.distance = distance ? parseInt(distance) : undefined;
      }
      
      if (id !== "category") {
        updatedFilters.category = category;
      }
      
      if (id !== "sort") {
        updatedFilters.sortBy = sortBy;
      }
      
      // Enviar filtros atualizados
      onFilterChange(updatedFilters);
    } else {
      // Update URL params
      const params = new URLSearchParams(window.location.search);
      if (id === "price") {
        params.delete("minPrice");
        params.delete("maxPrice");
      } else if (id === "sort") {
        params.delete("sortBy");
      } else {
        params.delete(id);
      }
      
      // Atualizar a URL sem recarregar a página
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.pushState({}, '', `/${newSearch}`);
      
      // Preparar os filtros atualizados para o evento
      let updatedFilters: FilterOptions = {};
      
      // Manter todos os filtros que não foram removidos
      if (id !== "price") {
        updatedFilters.minPrice = minPrice ? parseInt(minPrice) : undefined;
        updatedFilters.maxPrice = maxPrice ? parseInt(maxPrice) : undefined;
      }
      
      if (id !== "rating") {
        updatedFilters.rating = rating ?? undefined;
      }
      
      if (id !== "distance") {
        updatedFilters.distance = distance ? parseInt(distance) : undefined;
      }
      
      if (id !== "category") {
        updatedFilters.category = category;
      }
      
      if (id !== "sort") {
        updatedFilters.sortBy = sortBy;
      }
      
      // Disparar evento para notificar que os filtros foram atualizados
      const event = new CustomEvent('filtersChanged', { 
        detail: updatedFilters
      });
      window.dispatchEvent(event);
    }
  };
  
  const handleApplyFilters = () => {
    if (onFilterChange) {
      // Chamar a função de callback com os filtros atuais
      onFilterChange({
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        rating: rating ?? undefined,
        distance: distance ? parseInt(distance) : undefined,
        category,
        sortBy
      });
    } else {
      // Fallback para o comportamento anterior se onFilterChange não for fornecido
      // Build query params
      const params = new URLSearchParams(window.location.search);
      
      // Set price filters
      if (minPrice) params.set("minPrice", minPrice);
      else params.delete("minPrice");
      
      if (maxPrice) params.set("maxPrice", maxPrice);
      else params.delete("maxPrice");
      
      // Set rating filter
      if (rating) params.set("rating", rating.toString());
      else params.delete("rating");
      
      // Set distance filter
      if (distance) params.set("distance", distance);
      else params.delete("distance");
      
      // Set category filter
      if (category) params.set("category", category);
      else params.delete("category");
      
      // Set sort filter
      if (sortBy) params.set("sortBy", sortBy);
      else params.delete("sortBy");
      
      // Atualizar a URL sem recarregar a página
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      
      // Em vez de usar window.location.href que recarrega a página,
      // atualizar a URL com pushState e disparar um evento personalizado
      window.history.pushState({}, '', `/${newSearch}`);
      
      // Disparar evento para notificar outros componentes
      const event = new CustomEvent('filtersChanged', { 
        detail: { 
          minPrice: minPrice ? parseInt(minPrice) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
          rating: rating ?? undefined,
          distance: distance ? parseInt(distance) : undefined,
          category,
          sortBy
        } 
      });
      window.dispatchEvent(event);
    }
  };
  
  const handleResetFilters = () => {
    // Reset all filter states
    setMinPrice("");
    setMaxPrice("");
    setRating(null);
    setDistance("");
    setCategory("");
    setSortBy("");
    
    // Use the onFilterChange callback se estiver disponível
    if (onFilterChange) {
      onFilterChange({});
    } else {
      // Remove filter params from URL
      const params = new URLSearchParams(window.location.search);
      ["minPrice", "maxPrice", "rating", "distance", "category", "sortBy"].forEach(param => {
        params.delete(param);
      });
      
      const queryParam = params.get("query");
      const locationParam = params.get("location");
      
      // Keep only search and location params
      const newParams = new URLSearchParams();
      if (queryParam) newParams.set("query", queryParam);
      if (locationParam) newParams.set("location", locationParam);
      
      // Atualizar a URL sem recarregar a página
      const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
      window.history.pushState({}, '', `/${newSearch}`);
      
      // Disparar evento para notificar que os filtros foram resetados
      const event = new CustomEvent('filtersChanged', { 
        detail: {} 
      });
      window.dispatchEvent(event);
    }
  };
  
  const handleSelectCategory = (categoryValue: string) => {
    setCategory(categoryValue);
    
    if (onFilterChange) {
      onFilterChange({
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        rating: rating ?? undefined,
        distance: distance ? parseInt(distance) : undefined,
        category: categoryValue,
        sortBy
      });
    } else {
      const params = new URLSearchParams(window.location.search);
      params.set("category", categoryValue);
      
      // Atualizar a URL sem recarregar a página
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.pushState({}, '', `/${newSearch}`);
      
      // Disparar evento para notificar mudanças de filtro
      const event = new CustomEvent('filtersChanged', { 
        detail: { 
          minPrice: minPrice ? parseInt(minPrice) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
          rating: rating ?? undefined,
          distance: distance ? parseInt(distance) : undefined,
          category: categoryValue,
          sortBy
        } 
      });
      window.dispatchEvent(event);
    }
  };
  
  const handleSort = (sortValue: string) => {
    setSortBy(sortValue);
    
    // Destacar que estamos aplicando o filtro
    console.log("Aplicando ordenação:", sortValue);
    
    // Sempre usar o callback se disponível
    if (onFilterChange) {
      onFilterChange({
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        rating: rating ?? undefined,
        distance: distance ? parseInt(distance) : undefined,
        category,
        sortBy: sortValue
      });
    } else {
      const params = new URLSearchParams(window.location.search);
      params.set("sortBy", sortValue);
      
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      
      // Em vez de atualizar window.location.href, atualizar a URL sem recarregar a página
      window.history.pushState({}, '', `/${newSearch}`);
      
      // Disparar um evento personalizado para notificar outros componentes
      const event = new CustomEvent('filtersChanged', { 
        detail: { sortBy: sortValue }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {/* View Toggle - Keeping only list view */}
      <div className="flex border border-gray-300 rounded-md overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="px-3 py-1 rounded-none bg-primary text-white"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Filters Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-3 py-1 border border-gray-300 bg-white hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <div className="p-3">
            <p className="font-medium mb-2">Preço por hora</p>
            <div className="flex items-center">
              <Input 
                type="number" 
                placeholder="Min" 
                className="w-1/2 rounded-r-none" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input 
                type="number" 
                placeholder="Max" 
                className="w-1/2 rounded-l-none border-l-0" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <p className="font-medium mb-2">Avaliação</p>
            <div className="space-y-1">
              <label className="flex items-center">
                <Checkbox 
                  className="mr-2" 
                  checked={rating === 5}
                  onCheckedChange={() => setRating(rating === 5 ? null : 5)}
                />
                <Rating value={5} size="sm" />
              </label>
              <label className="flex items-center">
                <Checkbox 
                  className="mr-2" 
                  checked={rating === 4}
                  onCheckedChange={() => setRating(rating === 4 ? null : 4)}
                />
                <Rating value={4} size="sm" />
                <span className="ml-1 text-dark-medium text-sm">ou mais</span>
              </label>
              <label className="flex items-center">
                <Checkbox 
                  className="mr-2" 
                  checked={rating === 3}
                  onCheckedChange={() => setRating(rating === 3 ? null : 3)}
                />
                <Rating value={3} size="sm" />
                <span className="ml-1 text-dark-medium text-sm">ou mais</span>
              </label>
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <p className="font-medium mb-2">Distância</p>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a distância" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-3 border-t border-gray-200 flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Limpar filtros
            </Button>
            <Button variant="link" size="sm" className="text-primary font-medium" onClick={handleApplyFilters}>
              Aplicar
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-3 py-1 border border-gray-300 bg-white hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Categorias
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleSelectCategory("development")}>
            Desenvolvimento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectCategory("design")}>
            Design
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectCategory("marketing")}>
            Marketing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectCategory("writing")}>
            Redação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectCategory("photography")}>
            Fotografia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Sort Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-3 py-1 border border-gray-300 bg-white hover:bg-gray-50">
            <SortDesc className="mr-2 h-4 w-4" />
            Ordenar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleSort("rating")}>
            Melhor avaliados
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSort("price_asc")}>
            Menor preço
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSort("price_desc")}>
            Maior preço
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSort("distance")}>
            Mais próximos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Active Filters */}
      {activeFilters.map((filter) => (
        <Badge 
          key={filter.id}
          variant="outline" 
          className="px-3 py-1 border border-primary bg-blue-50 text-primary rounded-md"
        >
          {filter.label}
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 p-0 h-auto text-xs"
            onClick={() => handleRemoveFilter(filter.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}