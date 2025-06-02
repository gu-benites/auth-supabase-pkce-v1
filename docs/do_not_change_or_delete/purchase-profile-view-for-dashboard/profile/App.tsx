
import React from 'react';
import { ProfileDialogDemo } from './components/ProfileDialogDemo';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary">User Profile Editor</h1>
        <p className="text-muted-foreground text-center">Powered by shadcn/ui-like components & Tailwind CSS</p>
      </header>
      <main>
        <ProfileDialogDemo />
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          This demo showcases a dialog component integration.
        </p>
        <p>
          Image placeholders from <a href="https://picsum.photos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">picsum.photos</a>.
        </p>
      </footer>
    </div>
  );
};

export default App;
