import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Building, Heart, GraduationCap, Home, Users } from "lucide-react";

export default function OurStory() {
  return (
    <section id="our-story" className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Our Story –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            A Legacy of <span className="italic">Compassion</span> and{" "}
            <span className="font-bold">Service</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Founded in 1974 by two dedicated educators, Julie's has been transforming lives for five decades.
          </p>
        </div>

        <Tabs defaultValue="origins" className="w-full">
          <TabsList className="w-full inline-flex h-auto flex-nowrap overflow-x-auto sm:grid sm:grid-cols-3 mb-8">
            <TabsTrigger value="origins" data-testid="tab-origins" className="flex-shrink-0">
              Our Origins
            </TabsTrigger>
            <TabsTrigger value="building" data-testid="tab-building" className="flex-shrink-0">
              Historic Building
            </TabsTrigger>
            <TabsTrigger value="founders" data-testid="tab-founders" className="flex-shrink-0">
              Our Founders
            </TabsTrigger>
          </TabsList>

          {/* Origins Tab */}
          <TabsContent value="origins" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {/* Timeline Item 1974 */}
                <div className="flex gap-4 sm:gap-6" data-testid="timeline-1974">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-0.5 h-full bg-primary/20 mt-2" />
                  </div>
                  <div className="pb-8">
                    <div className="text-2xl font-serif font-bold text-primary mb-2" data-testid="year-1974">1974</div>
                    <h3 className="text-xl font-semibold mb-3" data-testid="heading-beginning">The Beginning</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Julie's was founded by two educators, Jean Sullivan, SND and Louise Kearns, SND, who had been working closely with struggling, female-headed families living in crisis at the margins of society.
                    </p>
                  </div>
                </div>

                {/* Timeline Item 1980 */}
                <div className="flex gap-4 sm:gap-6" data-testid="timeline-1980">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-0.5 h-full bg-primary/20 mt-2" />
                  </div>
                  <div className="pb-8">
                    <div className="text-2xl font-serif font-bold text-primary mb-2" data-testid="year-1980">1980</div>
                    <h3 className="text-xl font-semibold mb-3" data-testid="heading-merger">Merger & Unity</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Julie's began as two independent organizations: Julie's Children's House and the Adult Learning Program which merged in 1980. Julie's Children's House provided care and educational services to low-income, pre-school age children and their parents who lived in South Boston's D Street Public Housing Project. The Adult Learning Program provided adult education and support to poor, female head-of-households in the same community.
                    </p>
                  </div>
                </div>

                {/* Timeline Item 1986 */}
                <div className="flex gap-4 sm:gap-6" data-testid="timeline-1986">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-0.5 h-full bg-primary/20 mt-2" />
                  </div>
                  <div className="pb-8">
                    <div className="text-2xl font-serif font-bold text-primary mb-2" data-testid="year-1986">1986</div>
                    <h3 className="text-xl font-semibold mb-3" data-testid="heading-expansion">Expansion & Growth</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Julie's Family Learning Program secured space in the South Boston Boys and Girls Clubhouse, where we operated for 18 years. During that time, we enhanced our services to reflect an increased focus on college and job readiness, employer linkages, skills to help mothers transition from public assistance to training and employment, and post-employment support. We extended our children's program hours, designated a number of childcare spaces for Julie's working mothers, opened a licensed infant development center, and added summer programming.
                    </p>
                  </div>
                </div>

                {/* Timeline Item 2004 */}
                <div className="flex gap-4 sm:gap-6" data-testid="timeline-2004">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Home className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-0.5 h-full bg-primary/20 mt-2" />
                  </div>
                  <div className="pb-8">
                    <div className="text-2xl font-serif font-bold text-primary mb-2" data-testid="year-2004">2004</div>
                    <h3 className="text-xl font-semibold mb-3" data-testid="heading-own-home">Our Own Home</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Julie's moved into our own facility on Dorchester Street in South Boston and became a 501(c)(3) non-profit organization with a Board of Directors. We now house all of our services in a building owned by the George Robert White Fund, a trust managed by the City of Boston.
                    </p>
                  </div>
                </div>

                {/* Timeline Item 2015 */}
                <div className="flex gap-4 sm:gap-6" data-testid="timeline-2015">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-serif font-bold text-primary mb-2" data-testid="year-2015">2015</div>
                    <h3 className="text-xl font-semibold mb-3" data-testid="heading-honoring">Honoring Our Founders</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      On May 14, 2015, we honored our Co-Founders' contributions to the Greater Boston community for over 50 years of dedicated service. Honorary Chair was Mayor Martin Walsh and Event Chairs were Josh Kraft, Ellen Segal and Dana Smith.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Historic Building Tab */}
          <TabsContent value="building" className="mt-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card data-testid="card-building-legacy">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="heading-public-health-legacy">
                    <Building className="w-5 h-5 text-primary" />
                    A Public Health Legacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Julie's is housed in an historic building that began its life as a public health center. With funding from the George Robert White Fund, the facility was built as part of a campaign to provide the city with beautiful buildings to benefit the public. It was presented to the City of Boston on June 28th, 1927. The solarium on the rooftop floor was used for treating patients with tuberculosis.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-building-renovation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="heading-transformation">
                    <Home className="w-5 h-5 text-primary" />
                    Transformation & Renovation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    The period from 2003 through 2005 was a very important time of expansion and transition for Julie's. It was during these years that we became a 501(c)(3) non-profit organization and established our first Board of Directors. It was also when we moved into our very own building – the first time that Julie's had its own facility.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    After having completed a $3.7 million capital campaign, the building was renovated with the help of the architectural firm, John Catlin Associates & Architects. The architects worked closely with the staff to ensure that the design and space would best suit the needs of the women and children who would be using the building on a daily basis for years to come.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground italic" data-testid="text-building-ownership">
                      This building is owned by the George Robert White Fund, a trust managed by the City of Boston.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Founders Tab */}
          <TabsContent value="founders" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Sister Louise Kearns */}
              <Card data-testid="card-founder-louise">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif" data-testid="heading-louise-kearns">Sister Louise Kearns, SND</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-muted-foreground leading-relaxed">
                    <p>
                      Sister Louise Kearns, SND, joined the Sisters of Notre Dame de Namur in 1959.
                    </p>
                    <p>
                      She received a B.A. in Education and Biology from Emmanuel College and later earned a Master's in education and counseling from Antioch College.
                    </p>
                    <p>
                      In 1969, Sr. Louise moved into the D Street Housing Project in South Boston, where she taught junior high school students, and began a summer youth program.
                    </p>
                    <p>
                      While working in the projects, she became increasingly aware of the immense challenges facing poor families headed by single mothers.
                    </p>
                    <p className="font-medium text-foreground">
                      Her experiences lead her to finally establish an Adult Learning Program in 1979 in the community. The program provided the mothers with educational services and peer support, while their young children received quality day care.
                    </p>
                    <p>
                      The following year, Sister Louise joined hands with Sr. Jean Sullivan to create Julie's Family Learning Program.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sister Jean Sullivan */}
              <Card data-testid="card-founder-jean">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif" data-testid="heading-jean-sullivan">Sister Jean Sullivan, SND</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-muted-foreground leading-relaxed">
                    <p>
                      Sister Jean Sullivan, SND, joined the Sisters of Notre Dame de Namur in 1957.
                    </p>
                    <p>
                      Upon completing her Bachelor of Arts degree at Emmanuel College, she began teaching first grade in communities throughout Massachusetts. During her summer months, she worked with migrants in New Jersey and Delaware.
                    </p>
                    <p>
                      While working with migrant families, she encountered many children who had poor self-esteem and little self-confidence. Sr. Jean began searching for educational approaches that would best help these young children, and ultimately settled on the Montessori method as the most effective.
                    </p>
                    <p>
                      She earned her certification as a Montessori teacher from Cornell University, specifically choosing the Montessori method for creating and encouraging self-esteem building among lower income children.
                    </p>
                    <p className="font-medium text-foreground">
                      In 1974 Sr. Jean joined with Sr. Pat O'Malley to establish Julie's Children's House. The program was unique in that it not only offered a Montessori education to low-income children, it also provided their mothers with monthly home visits and educational sessions on parenting.
                    </p>
                    <p>
                      In 1980 Sister Jean and Sr. Louise Kearns decided to jointly create what is now Julie's Family Learning Program.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Legacy note spanning both columns */}
              <Card className="lg:col-span-2 bg-primary/5 border-primary/20" data-testid="card-legacy-note">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed text-center" data-testid="text-st-julie">
                    Sisters Jean and Louise named Julie's after <span className="font-semibold text-foreground">St. Julie Billiart</span>, foundress of their order, The Sisters of Notre Dame de Namur. St. Julie's vision was the development of a community of women who through simple and prayerful lives commit themselves to educating and serving others, especially those who are poor and marginalized.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
