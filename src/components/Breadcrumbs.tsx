import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
    <Link to="/" className="flex items-center gap-1 hover:text-foreground">
      <Home className="h-3.5 w-3.5" />
    </Link>
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1">
        <ChevronRight className="h-3.5 w-3.5" />
        {item.to ? (
          <Link to={item.to} className="hover:text-foreground">{item.label}</Link>
        ) : (
          <span className="text-foreground font-medium">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export default Breadcrumbs;
