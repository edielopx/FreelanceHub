import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { pesquisarLocais, EstadoData } from "@/lib/cities-data";
import { MapPin } from "lucide-react";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Digite uma cidade",
  className = "",
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [estados, setEstados] = useState<EstadoData[]>([]);
  const [cidades, setCidades] = useState<Array<{cidade: string, estado: string, sigla: string}>>([]);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar query com value prop quando value mudar externamente
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Atualizar a pesquisa quando o usuário digitar
  useEffect(() => {
    if (query.length >= 2) {
      const resultados = pesquisarLocais(query);
      setEstados(resultados.estados);
      setCidades(resultados.cidades);
      setIsOpen(true);
    } else {
      setEstados([]);
      setCidades([]);
      setIsOpen(false);
    }
  }, [query]);

  // Fechar quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (local: string) => {
    onChange(local);
    setQuery(local);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue); // Também atualiza o valor no componente pai
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setFocused(true);
            if (query.length >= 2) setIsOpen(true);
          }}
          onBlur={() => {
            // Dá um tempo antes de fechar para permitir cliques nas sugestões
            setTimeout(() => {
              if (!focused) setIsOpen(false);
            }, 200);
          }}
          placeholder={placeholder}
          className={`pl-8 ${className}`}
          autoComplete="off"
        />
        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      {isOpen && (cidades.length > 0 || estados.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {cidades.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidades
                </div>
                {cidades.map((item, index) => (
                  <div
                    key={`${item.cidade}-${item.sigla}-${index}`}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                    onMouseDown={() => handleSelect(`${item.cidade}, ${item.sigla}`)}
                  >
                    {item.cidade}, {item.sigla}
                  </div>
                ))}
              </div>
            )}

            {estados.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estados
                </div>
                {estados.map((estado) => (
                  <div
                    key={estado.sigla}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                    onMouseDown={() => handleSelect(estado.sigla)}
                  >
                    {estado.nome} ({estado.sigla})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}