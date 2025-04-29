import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Search,
  MessageSquare,
  Briefcase,
  Heart,
  User,
  LogOut,
  Calendar,
  FileText,
  PlusCircle,
  Award,
  BadgeCheck,
  ShieldAlert,
  Key
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isFreelancer = user?.userType === "freelancer";
  const isClient = user?.userType === "client";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  // Itens de navegação comuns para todos os usuários
  const commonNavItems = [
    { 
      label: "Mensagens", 
      icon: <MessageSquare className="w-5 h-5 mr-3" />, 
      path: "/messages" 
    },
    { 
      label: "Perfil", 
      icon: <User className="w-5 h-5 mr-3" />, 
      path: "/profile" 
    },
  ];
  
  // Item de administração apenas para o usuário edielopx
  const adminNavItems = user?.username === "edielopx" ? [
    { 
      label: "Admin (DEV)", 
      icon: <ShieldAlert className="w-5 h-5 mr-3 text-purple-600" />, 
      path: "/admin" 
    },
  ] : [];

  // Itens de navegação específicos para clientes
  const clientNavItems = [
    { 
      label: "Buscar Freelancers", 
      icon: <Search className="w-5 h-5 mr-3" />, 
      path: "/" 
    },
    // Item de mapa de profissionais removido
    { 
      label: "Meus Trabalhos", 
      icon: <Briefcase className="w-5 h-5 mr-3" />, 
      path: "/jobs" 
    },
    { 
      label: "Publicar Trabalho", 
      icon: <PlusCircle className="w-5 h-5 mr-3" />, 
      path: "/create-job",
      highlight: true
    },
    { 
      label: "Meus Agendamentos", 
      icon: <Calendar className="w-5 h-5 mr-3" />, 
      path: "/appointments" 
    },
    { 
      label: "Favoritos", 
      icon: <Heart className="w-5 h-5 mr-3" />, 
      path: "/favorites" 
    },
  ];

  // Itens de navegação específicos para freelancers
  const freelancerNavItems = [
    { 
      label: "Meu Painel", 
      icon: <BadgeCheck className="w-5 h-5 mr-3" />, 
      path: "/" 
    },
    { 
      label: "Oportunidades", 
      icon: <Briefcase className="w-5 h-5 mr-3" />, 
      path: "/jobs" 
    },
    { 
      label: "Meus Serviços", 
      icon: <FileText className="w-5 h-5 mr-3" />, 
      path: "/services" 
    },
    { 
      label: "Adicionar Serviço", 
      icon: <PlusCircle className="w-5 h-5 mr-3" />, 
      path: "/services/new",
      highlight: true
    },
    { 
      label: "Agendamentos", 
      icon: <Calendar className="w-5 h-5 mr-3" />, 
      path: "/appointments" 
    },
    { 
      label: "Avaliações", 
      icon: <Award className="w-5 h-5 mr-3" />, 
      path: "/reviews" 
    },
  ];



  // Determinar quais itens exibir com base no tipo de usuário
  const navItems = isFreelancer ? freelancerNavItems : isClient ? clientNavItems : [];

  // Determinar a página inicial baseada no tipo de usuário
  const getHomePath = () => {
    if (!user) return "/";
    return isFreelancer ? "/" : "/";
  };

  return (
    <div className={`hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <Link href={getHomePath()}>
          <h1 className="text-2xl font-bold text-primary cursor-pointer hover:text-primary/90 transition-colors">FreelanceHub</h1>
        </Link>
      </div>
      
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={`Foto de ${user.name}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full p-2 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-dark">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="pl-1">
              <Badge className={isFreelancer ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}>
                {isFreelancer ? "Freelancer" : "Contratante"}
              </Badge>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex items-center p-2 rounded-md font-medium ${
              isActive(item.path) 
                ? "bg-blue-50 text-primary" 
                : item.highlight
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "hover:bg-gray-100 text-dark-medium"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        
        {commonNavItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex items-center p-2 rounded-md font-medium ${
              isActive(item.path) 
                ? "bg-blue-50 text-primary" 
                : "hover:bg-gray-100 text-dark-medium"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        
        {adminNavItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex items-center p-2 rounded-md font-medium ${
              isActive(item.path) 
                ? "bg-blue-50 text-primary" 
                : "hover:bg-gray-100 text-dark-medium"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 space-y-2">
        <NotificationDropdown />
        
        <Button
          variant="ghost"
          className="flex items-center p-2 w-full text-dark-medium hover:bg-gray-100 rounded-md"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}
