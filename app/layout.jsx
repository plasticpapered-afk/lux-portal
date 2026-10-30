import './globals.css';
import WhatsAppFloat from '../components/WhatsAppFloat';

export const metadata = {
  title: 'LUX Portal - apply, upload and track',
  description: 'Agency application portal with document upload, staff review and status tracking.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
