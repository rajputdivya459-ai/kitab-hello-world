import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ContactForm } from '@/components/public/ContactForm';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function Contact() {
  const { getSetting } = useSiteSettings();

  const collegeName = getSetting('college_name', 'Mahatma Gandhi Mahavidhyala Ashta');
  const address = getSetting('address', 'Near Mukharji Ground, Kannod Road, Ashta, District Sehore, Madhya Pradesh');
  const phone = getSetting('contact_phone', '+91 7562-222XXX');
  const email = getSetting('contact_email', 'info@mgmahavidhyala.ac.in');

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-hero text-primary-foreground">
        <div className="container-college">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-primary-foreground/80">
              {getSetting('contact_hero_subtitle', 'Have questions about admissions or our programs? We\'d love to hear from you.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding">
        <div className="container-college">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Get in Touch
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Address</h3>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                    <p className="text-muted-foreground">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground">{email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Office Hours</h3>
                    <p className="text-muted-foreground">
                      {getSetting('office_hours', 'Mon - Sat: 9:00 AM - 5:00 PM\nSunday: Closed')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-card rounded-2xl border border-border p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Send us a Message
                </h2>
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container-college">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <iframe
              src={getSetting('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.0!2d76.7!3d23.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDA0JzQyLjAiTiA3NsKwNDInMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890')}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${collegeName} Location`}
              className="w-full"
            />
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
