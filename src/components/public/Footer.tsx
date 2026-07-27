import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useSocialLinks } from '@/hooks/useSocialLinks';

const iconMap: Record<string, typeof Globe> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

export function Footer() {
  const { getSetting } = useSiteSettings();
  const { links: socialLinks } = useSocialLinks();

  const collegeName = getSetting('college_name', 'Mahatma Gandhi Mahavidhyala Ashta');
  const logoUrl = getSetting('logo_url');
  const footerText = getSetting('footer_text', 'Affiliated to Barkatullah University, Bhopal.');
  const copyrightText = getSetting('copyright_text', 'Mahatma Gandhi Mahavidhyala, Ashta. All rights reserved.');
  const address = getSetting('address', 'Near Mukharji Ground, Kannod Road, Ashta, District Sehore, Madhya Pradesh');
  const phone = getSetting('contact_phone', '+91 7562-222XXX');
  const email = getSetting('contact_email', 'info@mgmahavidhyala.ac.in');

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-college py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={collegeName} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="bg-accent p-2 rounded-lg">
                  <span className="text-accent-foreground font-bold text-lg">MG</span>
                </div>
              )}
              <div>
                <h3 className="font-display text-lg font-bold leading-tight">{collegeName}</h3>
              </div>
            </Link>
            <p className="text-sm opacity-80 leading-relaxed">{footerText}</p>

            {/* Social Links from DB */}
            {(Array.isArray(socialLinks) ? socialLinks : []).length > 0 && (
              <div className="flex gap-3 pt-2">
                {(Array.isArray(socialLinks) ? socialLinks : []).map((link) => {
                  const Icon = iconMap[link.icon || ''] || Globe;
                  return (
                    <a
                      key={link.id}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform_name}
                      className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/80 active:bg-primary-foreground/20 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { href: '/#about', label: 'About Us' },
                { href: '/departments', label: 'Departments' },
                { href: '/faculty', label: 'Faculty' },
                { href: '/events', label: 'Events' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm opacity-80 active:opacity-100 active:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-accent flex-shrink-0" />
                <span className="text-sm opacity-80">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-accent" />
                <span className="text-sm opacity-80">{phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <span className="text-sm opacity-80">{email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-10 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-70 text-center md:text-left">
            © {new Date().getFullYear()} {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
