import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail } from 'lucide-react';
import { getMembers } from '@/services/api';
import type { Member } from '@/types/database';

export function MembersCarousel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getMembers();
        const data = Array.isArray(result) ? result : [];
        if (mounted) setMembers(data as Member[]);
      } catch (err) {
        console.error('MembersCarousel load error:', err);
        if (mounted) setMembers([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container-college">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse flex space-x-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-64 h-72 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  // Duplicate for infinite scroll
  const duplicatedMembers = [...members, ...members, ...members];

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'principal':
        return 'bg-primary text-primary-foreground';
      case 'director':
        return 'bg-accent text-accent-foreground';
      case 'management':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (roleType: string) => {
    switch (roleType) {
      case 'principal':
        return 'Principal';
      case 'director':
        return 'Director';
      case 'management':
        return 'Management';
      default:
        return 'Staff';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20 overflow-hidden">
      <div className="container-college mb-12">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Leadership
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the visionary leaders guiding MGCM towards excellence
          </p>
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          className="flex gap-8 py-4 px-4"
          animate={{
            x: [0, -320 * members.length],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: members.length * 6,
              ease: "linear",
            },
          }}
        >
          {duplicatedMembers.map((member, index) => (
            <div
              key={`${member.id}-${index}`}
              className="flex-shrink-0 w-72"
            >
              <div className="bg-card rounded-2xl shadow-md overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-14 h-14 text-primary" />
                    </div>
                  )}
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role_type)}`}>
                    {getRoleLabel(member.role_type)}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-accent font-medium text-sm mb-3">
                    {member.designation}
                  </p>
                  {member.bio && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {member.bio}
                    </p>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
