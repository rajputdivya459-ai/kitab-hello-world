 import { useState } from 'react';
 import { useForm } from 'react-hook-form';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { z } from 'zod';
 import { Send, CheckCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { submitContactForm } from '@/services/api';
 import { useToast } from '@/hooks/use-toast';
 
 const contactSchema = z.object({
   name: z.string().min(2, 'Name must be at least 2 characters').max(100),
   email: z.string().email('Please enter a valid email address').max(255),
   phone: z.string().optional(),
   subject: z.string().optional(),
   message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
 });
 
 type ContactFormData = z.infer<typeof contactSchema>;
 
 export function ContactForm() {
   const [isSubmitted, setIsSubmitted] = useState(false);
   const { toast } = useToast();
   const {
     register,
     handleSubmit,
     formState: { errors, isSubmitting },
     reset,
   } = useForm<ContactFormData>({
     resolver: zodResolver(contactSchema),
   });
 
  const onSubmit = async (data: ContactFormData) => {
    const submissionData = {
      name: data.name,
      email: data.email,
      message: data.message,
      phone: data.phone,
      subject: data.subject,
    };
     try {
      await submitContactForm(submissionData);
       setIsSubmitted(true);
       reset();
       toast({
         title: 'Message sent!',
         description: 'Thank you for contacting us. We\'ll get back to you soon.',
       });
     } catch (error) {
       toast({
         title: 'Error',
         description: 'Failed to send message. Please try again.',
         variant: 'destructive',
       });
     }
   };
 
   if (isSubmitted) {
     return (
       <div className="text-center py-12 px-6 bg-secondary/50 rounded-2xl">
         <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
         <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
           Thank You!
         </h3>
         <p className="text-muted-foreground mb-6">
           Your message has been sent successfully. We'll get back to you soon.
         </p>
         <Button onClick={() => setIsSubmitted(false)} variant="outline">
           Send Another Message
         </Button>
       </div>
     );
   }
 
   return (
     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <div className="space-y-2">
           <Label htmlFor="name">Name *</Label>
           <Input
             id="name"
             placeholder="Your full name"
             {...register('name')}
             className={errors.name ? 'border-destructive' : ''}
           />
           {errors.name && (
             <p className="text-sm text-destructive">{errors.name.message}</p>
           )}
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="email">Email *</Label>
           <Input
             id="email"
             type="email"
             placeholder="your.email@example.com"
             {...register('email')}
             className={errors.email ? 'border-destructive' : ''}
           />
           {errors.email && (
             <p className="text-sm text-destructive">{errors.email.message}</p>
           )}
         </div>
       </div>
 
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <div className="space-y-2">
           <Label htmlFor="phone">Phone</Label>
           <Input
             id="phone"
             type="tel"
             placeholder="+1 (555) 123-4567"
             {...register('phone')}
           />
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="subject">Subject</Label>
           <Input
             id="subject"
             placeholder="How can we help?"
             {...register('subject')}
           />
         </div>
       </div>
 
       <div className="space-y-2">
         <Label htmlFor="message">Message *</Label>
         <Textarea
           id="message"
           placeholder="Tell us more about your inquiry..."
           rows={6}
           {...register('message')}
           className={errors.message ? 'border-destructive' : ''}
         />
         {errors.message && (
           <p className="text-sm text-destructive">{errors.message.message}</p>
         )}
       </div>
 
       <Button
         type="submit"
         size="lg"
         className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
         disabled={isSubmitting}
       >
         {isSubmitting ? (
           'Sending...'
         ) : (
           <>
             Send Message
             <Send className="ml-2 h-5 w-5" />
           </>
         )}
       </Button>
     </form>
   );
 }