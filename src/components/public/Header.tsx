import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/departments', label: 'Departments' },
  { href: '/faculty', label: 'Faculty' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { getSetting } = useSiteSettings();

  const collegeName = getSetting('college_name', 'MG Mahavidhyala');
  const logoUrl = getSetting('logo_url');

  return (
    <header className="relative z-50 bg-primary border-b border-primary-foreground/10">
      <div className="container-college">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={collegeName} className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover" />
            ) : (
              <div className="bg-accent p-2 rounded-lg">
                <span className="text-accent-foreground font-bold text-lg">MG</span>
              </div>
            )}
            <div>
              <h1 className="font-display text-sm md:text-lg font-bold text-primary-foreground leading-tight">
                {collegeName.length > 20 ? collegeName.slice(0, 20) : collegeName}
              </h1>
              <p className="text-[10px] md:text-xs text-primary-foreground/70">
                {getSetting('address', 'Ashta, Sehore').split(',').slice(-2).join(',').trim()}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.href
                    ? 'text-accent bg-primary-foreground/10'
                    : 'text-primary-foreground/80 active:bg-primary-foreground/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Admin Link & Mobile Menu */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="hidden sm:block">
              <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground bg-transparent">
                Admin
              </Button>
            </Link>

            <button
              className="lg:hidden p-2 rounded-lg active:bg-primary-foreground/10 transition-colors text-primary-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t border-primary-foreground/10 animate-fade-in pb-4">
            <nav className="py-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'text-accent bg-primary-foreground/10'
                      : 'text-primary-foreground/80 active:bg-primary-foreground/10'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-accent active:bg-primary-foreground/10 rounded-lg"
              >
                Admin Portal
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
