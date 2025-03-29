'use client'

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState, useRef } from 'react';

const InterviewPage = () => {
  const searchParams = useSearchParams();
  const filename = searchParams.get('filename');
  const name = searchParams.get('name');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false); // Track fullscreen state
  const iframeRef = useRef<HTMLIFrameElement>(null); // Reference to the iframe

  useEffect(() => {
    // Simulate loading candidate data
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const startInterview = () => {
    setInterviewStarted(true);
    // This would typically come from your API or configuration
    setIframeUrl(`http://localhost:3000?user=${filename}&name=${encodeURIComponent(name || '')}`);
    
    toast({
      title: "Interview Started",
      description: `Beginning AI interview with ${name}`,
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'CN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Function to toggle full screen
  const toggleFullScreen = () => {
    if (!iframeRef.current) return;
    
    if (!document.fullscreenElement) {
      // Request full screen
      iframeRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      // Exit full screen
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Function to open the iframe URL in a new tab
  const openInNewTab = () => {
    window.open(iframeUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            AI Interview Session
          </CardTitle>
          <CardDescription>
            {interviewStarted 
              ? `Interview in progress with ${name}` 
              : `Prepare to interview ${name}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`/candidates/${filename}.jpg`} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{name}</h3>
              <p className="text-sm text-gray-500">Candidate ID: {filename}</p>
            </div>
          </div>

          {interviewStarted ? (
            <div className="space-y-4">
              <div
                className={`relative pb-[56.25%] h-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 ${
                  isFullScreen ? 'fixed inset-0 z-50' : 'w-full max-w-4xl'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  src={iframeUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="microphone; camera; screen-will-share"
                  allowFullScreen
                  title="AI Interview Interface"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setInterviewStarted(false)}>
                  End Interview
                </Button>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="flex h-2 w-2 rounded-full bg-green-500" />
                  <span>Live Connection</span>
                </div>
              </div>

              {/* Button to toggle full-screen mode */}
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={toggleFullScreen}>
                  {isFullScreen ? 'Exit Full Screen' : 'Go Full Screen'}
                </Button>
              </div>

              {/* Button to open the iframe in a new tab */}
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={openInNewTab}>
                  Open Interview in New Tab
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800">Preparation Checklist</h4>
                <ul className="mt-2 space-y-2 text-sm text-yellow-700 list-disc pl-5">
                  <li>Ensure you're in a quiet environment</li>
                  <li>Check your microphone and camera</li>
                  <li>Have your resume handy for reference</li>
                  <li>Prepare for behavioral and technical questions</li>
                </ul>
              </div>

              <Button 
                onClick={startInterview}
                className="w-full py-6 text-lg"
              >
                Start AI Interview
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-gray-500">
          <p>AI Interview System v2.4</p>
          <p>Confidential</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InterviewPage;
