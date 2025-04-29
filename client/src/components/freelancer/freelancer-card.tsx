import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapPin, User } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FreelancerProfileModal } from "./freelancer-profile-modal";
import { ChatModal } from "@/components/chat/chat-modal";
import { FreelancerWithDetails } from "@shared/schema";

interface FreelancerCardProps {
  freelancer: FreelancerWithDetails;
}

export function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const { toast } = useToast();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const handleViewProfile = () => {
    setShowProfileModal(true);
  };

  const handleContactFreelancer = () => {
    setShowChatModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {freelancer.user.profileImage ? (
                <img 
                  src={freelancer.user.profileImage} 
                  alt={`Foto de ${freelancer.user.name}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-full h-full p-3 text-gray-500" />
              )}
            </div>
            
            <div className="ml-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-dark">{freelancer.user.name}</h3>
                  <p className="text-dark-medium text-sm">{freelancer.profile.title}</p>
                </div>
                <div className="text-right">
                  <Rating 
                    value={freelancer.avgRating} 
                    showValue={true}
                    reviewCount={freelancer.reviewCount}
                    size="sm"
                  />
                  <p className="text-secondary font-semibold">R$ {freelancer.profile.hourlyRate}/h</p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center flex-wrap gap-2">
                {freelancer.profile.skills.slice(0, 4).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-50 text-primary text-xs border-0 rounded-md">
                    {skill}
                  </Badge>
                ))}
              </div>
              
              <p className="mt-3 text-dark-medium text-sm line-clamp-2">
                {freelancer.user.bio}
              </p>
              
              <div className="mt-3 flex items-center text-dark-light text-sm">
                <MapPin className="mr-1 h-4 w-4" />
                <span>{freelancer.user.location}</span>
                {freelancer.distance !== undefined && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{freelancer.distance.toFixed(1)} km</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="flex border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="flex-1 py-2 text-center text-dark-medium hover:bg-gray-50 rounded-none"
            onClick={handleViewProfile}
          >
            <User className="mr-2 h-4 w-4" />
            Ver perfil
          </Button>
          <Button 
            variant="ghost" 
            className="flex-1 py-2 text-center text-primary hover:bg-blue-50 border-l border-gray-200 rounded-none"
            onClick={handleContactFreelancer}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Contatar
          </Button>
        </div>
      </Card>

      {showProfileModal && (
        <FreelancerProfileModal 
          freelancerId={freelancer.user.id} 
          open={showProfileModal} 
          onOpenChange={setShowProfileModal} 
        />
      )}

      {showChatModal && (
        <ChatModal 
          recipient={freelancer.user}
          open={showChatModal} 
          onOpenChange={setShowChatModal} 
        />
      )}
    </>
  );
}
