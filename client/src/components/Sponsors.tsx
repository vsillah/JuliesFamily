import { Card } from "@/components/ui/card";
import cummingsLogo from "@assets/CumminsFoundationlogo_1762691811373.webp";
import pierceLogo from "@assets/Pierce_VerticalLogoWithTag_Blue_300ppi-550x434.jpg_1762691811374.webp";
import candidLogo from "@assets/CandidAwardImg.jpg_1762691811371.webp";

export default function Sponsors() {
  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Our Partners –
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-semibold mb-4">
            Supported by <span className="italic">Generous</span> Partners
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 text-center">
            <div className="flex items-center justify-center h-40 w-40 mx-auto mb-4">
              <img 
                src={cummingsLogo} 
                alt="Cummings Foundation $100k for 100 logo"
                className="h-full w-full object-contain mix-blend-multiply"
                data-testid="img-cummings-logo"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">Cummings Foundation</h3>
            <p className="text-sm text-muted-foreground">
              Proud recipient of a $100k for 100 grant supporting our mission.
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="flex items-center justify-center h-32 w-32 mx-auto mb-4">
              <img 
                src={pierceLogo} 
                alt="Pierce Property Services logo"
                className="h-full w-full object-contain mix-blend-multiply"
                data-testid="img-pierce-logo"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">Pierce Property Services</h3>
            <p className="text-sm text-muted-foreground">
              Providing invaluable in-kind services to support our programs.
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="flex items-center justify-center h-32 w-32 mx-auto mb-4">
              <img 
                src={candidLogo} 
                alt="Candid Platinum Transparency 2024 Seal"
                className="h-full w-full object-contain"
                data-testid="img-candid-logo"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">GuideStar Platinum Seal</h3>
            <p className="text-sm text-muted-foreground">
              2024 Platinum Seal of Transparency in recognition of our financial integrity.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
