const Footer = () => {
  return (
    <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs sm:text-sm text-muted-foreground">
      <span className="inline-block">© {new Date().getFullYear()} Medsuite-eT — All rights reserved.</span>{" "}
      <span className="inline-block">
        Made with 💙 by{" "}
        <a href="https://engineerstechbd.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          engineersTech
        </a>
      </span>
    </footer>
  );
};

export default Footer;
