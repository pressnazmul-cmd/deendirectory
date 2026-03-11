import { GraduationCap, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InstituteCardProps {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
}

const typeColors: Record<string, string> = {
  School: "bg-primary/10 text-primary border-primary/20",
  College: "bg-accent/10 text-accent border-accent/20",
  Madrasa: "bg-secondary text-secondary-foreground border-border",
};

const InstituteCard = ({ id, name, type, address, phone }: InstituteCardProps) => (
  <div className="rounded-xl border bg-card p-5 card-elevated">
    <div className="mb-3 flex items-start justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-card-foreground">{name}</h3>
      </div>
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[type] || ""}`}>
        {type}
      </span>
    </div>
    {address && (
      <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> {address}
      </p>
    )}
    {phone && (
      <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Phone className="h-3.5 w-3.5" /> {phone}
      </p>
    )}
    <Link to={`/institutes/${id}`}>
      <Button size="sm" variant="outline" className="w-full">
        View Details
      </Button>
    </Link>
  </div>
);

export default InstituteCard;
