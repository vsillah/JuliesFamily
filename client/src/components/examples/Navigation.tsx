import Navigation from '../Navigation';

export default function NavigationExample() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-32 px-8">
        <p className="text-muted-foreground">Scroll down to see the navigation bar change on scroll.</p>
        <div className="h-[200vh]" />
      </div>
    </div>
  );
}
