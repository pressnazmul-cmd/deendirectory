import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface LocationCardProps {
  name: string;
  to: string;
  count?: number;
}

const LocationCard = ({ name, to, count }: LocationCardProps) => (
  <Link
    to={to}
    className="group flex items-center justify-between rounded-xl border bg-card p-4 card-elevated"
  >
    <div>
      <h3 className="font-display font-semibold text-card-foreground">{name}</h3>
      {count !== undefined && (
        <p className="text-sm text-muted-foreground">{count} items</p>
      )}
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
  </Link>
);

export default LocationCard;
