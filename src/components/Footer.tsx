const WHATSAPP_HELP = "https://wa.me/8801873722228?text=Hi%2C%20I%20need%20help%20with%20MedSuite";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs sm:text-sm text-muted-foreground">
      <span className="inline-block">© {new Date().getFullYear()} MedSuite — All rights reserved.</span>{" "}
      <span className="inline-block">
        Made with 💙 by{" "}
        <a href="https://engineerstechbd.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline transition-colors">
          engineersTech
        </a>
        {" "}|{" "}
        <a href={WHATSAPP_HELP} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline transition-colors">
          Support
        </a>
      </span>
    </footer>
  );
};

export default Footer;
