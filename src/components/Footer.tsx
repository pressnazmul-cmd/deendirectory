import { GraduationCap } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-card py-8">
    <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" />
        <span className="font-display font-semibold text-foreground">BD Education Directory</span>
      </div>
      <p>A comprehensive directory of educational institutes in Bangladesh</p>
    </div>
  </footer>
);

export default Footer;
