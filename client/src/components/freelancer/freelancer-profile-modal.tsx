import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MapPin, User, Briefcase, GraduationCap, MessageCircle, Loader2, Calendar } from "lucide-react";
import { FreelancerWithDetails, Review, Service } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface FreelancerProfileModalProps {
  freelancerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FreelancerProfileModal({
  freelancerId,
  open,
  onOpenChange,
}: FreelancerProfileModalProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("about");
  
  // Buscar detalhes do freelancer
  const { data: freelancer, isLoading, error } = useQuery({
    queryKey: [`/api/freelancers/${freelancerId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/freelancers/${freelancerId}`);
      return await res.json();
    },
    enabled: open && !!freelancerId,
  });

  // Reset tab when opening a different freelancer
  useEffect(() => {
    if (open) {
      setActiveTab("about");
    }
  }, [open, freelancerId]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !freelancer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-center text-destructive">
              Ocorreu um erro ao carregar os detalhes do freelancer.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const { user: freelancerUser, profile, services, reviews, avgRating, reviewCount } = freelancer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Perfil do Freelancer</DialogTitle>
        </DialogHeader>
        
        {/* Cabeçalho do perfil */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border">
            {freelancerUser.profileImage ? (
              <img 
                src={freelancerUser.profileImage} 
                alt={`Foto de ${freelancerUser.name}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{freelancerUser.name}</h2>
            <p className="text-lg text-muted-foreground mb-2">{profile.title}</p>
            
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="flex items-center">
                <Rating value={avgRating || 0} readOnly size="sm" />
                <span className="ml-2 text-sm">
                  {avgRating ? avgRating.toFixed(1) : '-'} ({reviewCount})
                </span>
              </div>
              
              {freelancerUser.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {freelancerUser.location}
                </div>
              )}
              
              <Badge className="font-normal">R$ {profile.hourlyRate}/hora</Badge>
            </div>
            
            {/* Botões de ação */}
            <div className="flex flex-wrap gap-2">
              {user && user.id !== freelancerUser.id && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      // Aqui redirecionaria para a página de chat
                      // Por enquanto apenas fecha o modal
                      onOpenChange(false);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Mensagem
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={() => {
                      // Aqui redirecionaria para a página de agendamento
                      if (services && services.length > 0) {
                        onOpenChange(false);
                        setLocation(`/new-appointment?serviceId=${services[0].id}`);
                      }
                    }}
                    disabled={!services || services.length === 0}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Agendar Serviço
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Abas do perfil */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>
          
          {/* Aba: Sobre */}
          <TabsContent value="about" className="space-y-4">
            {freelancerUser.bio && (
              <div>
                <h3 className="text-lg font-medium mb-2">Biografia</h3>
                <p className="text-sm text-gray-600">{freelancerUser.bio}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
            
            {profile.experience && (
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Briefcase className="h-5 w-5 mr-1 text-muted-foreground" />
                  Experiência
                </h3>
                <p className="text-sm text-gray-600">{profile.experience}</p>
              </div>
            )}
            
            {profile.education && (
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-1 text-muted-foreground" />
                  Formação
                </h3>
                <p className="text-sm text-gray-600">{profile.education}</p>
              </div>
            )}
          </TabsContent>
          
          {/* Aba: Serviços */}
          <TabsContent value="services">
            {services && services.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((service: Service) => (
                  <Card key={service.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <div className="text-xl font-bold text-primary">
                        R$ {service.price.toFixed(2)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-4">{service.description}</p>
                      
                      <Button 
                        size="sm" 
                        className="mt-4"
                        onClick={() => {
                          onOpenChange(false);
                          setLocation(`/new-appointment?serviceId=${service.id}`);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Agendar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Este freelancer ainda não possui serviços cadastrados.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Aba: Avaliações */}
          <TabsContent value="reviews">
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: Review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{review.clientName || "Cliente"}</h4>
                          <div className="text-xs text-muted-foreground">
                            {review.createdAt ? formatDate(new Date(review.createdAt)) : "-"}
                          </div>
                        </div>
                        <Rating value={review.rating} readOnly size="sm" />
                      </div>
                      
                      {review.comment && (
                        <p className="text-sm mt-2">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Este freelancer ainda não recebeu avaliações.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}