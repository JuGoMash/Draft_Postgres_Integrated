import { MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const footerLinks = {
  patients: [
    { name: 'Find Doctors', href: '/search' },
    { name: 'Book Appointment', href: '/search' },
    { name: 'Video Consultation', href: '/telemedicine' },
    { name: 'Health Records', href: '/records' },
    { name: 'Insurance', href: '/insurance' },
  ],
  doctors: [
    { name: 'Join Platform', href: '/doctors/join' },
    { name: 'Manage Schedule', href: '/doctors/schedule' },
    { name: 'Patient Management', href: '/doctors/patients' },
    { name: 'Analytics', href: '/doctors/analytics' },
    { name: 'Support', href: '/doctors/support' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'HIPAA Compliance', href: '/hipaa' },
  ],
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'LinkedIn', icon: Linkedin, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <MapPin className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold text-primary">IronLedgerMedMap</span>
            </div>
            <p className="text-gray-400 mb-4">
              Making healthcare accessible by connecting patients with the right doctors.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-primary transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* For Patients */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Patients</h3>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.patients.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* For Doctors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Doctors</h3>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.doctors.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 IronLedgerMedMap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
