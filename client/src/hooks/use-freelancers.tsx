import { useQuery } from "@tanstack/react-query";
import { FreelancerWithDetails } from "@shared/schema";

interface UseFreelancersOptions {
  query?: string;
  category?: string;
  location?: string;
  distance?: number;
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
}

export function useFreelancers(options: UseFreelancersOptions = {}) {
  const queryParams = new URLSearchParams();
  
  if (options.query) queryParams.set("query", options.query);
  if (options.category) queryParams.set("category", options.category);
  if (options.location) queryParams.set("location", options.location);
  if (options.distance) queryParams.set("distance", options.distance.toString());
  if (options.rating) queryParams.set("rating", options.rating.toString());
  if (options.minPrice) queryParams.set("minPrice", options.minPrice.toString());
  if (options.maxPrice) queryParams.set("maxPrice", options.maxPrice.toString());
  if (options.latitude) queryParams.set("lat", options.latitude.toString());
  if (options.longitude) queryParams.set("lng", options.longitude.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  return useQuery<FreelancerWithDetails[]>({
    queryKey: [`/api/freelancers${queryString}`],
  });
}

export function useFreelancerDetails(freelancerId: number) {
  return useQuery<FreelancerWithDetails>({
    queryKey: [`/api/freelancers/${freelancerId}`],
    enabled: !!freelancerId,
  });
}
