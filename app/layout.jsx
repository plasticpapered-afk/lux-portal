import './globals.css';

export const metadata = {
  title: 'LUX Portal - application and review',
  description: 'Apply, upload documents, and track your application. Staff back office included.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
