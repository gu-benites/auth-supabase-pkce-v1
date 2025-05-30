"use client";

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import ShinyText from '../shiny-text/shiny-text'; 
import RotatingText from '../rotating-text/rotating-text';
import { SlackIcon, TeamsIcon, DiscordIcon, EmailIconSvg } from './works-with-icons'; 

const HeroContent: React.FC = () => {
  const rotatingWords = ['Support', 'Experiences', 'Relationships', 'Help', 'Service'];
  const rotatingTextProps = {
    texts: rotatingWords,
    mainClassName: "text-primary mx-1", 
    staggerFrom: "last",
    initial: { y: "-100%", opacity: 0 }, 
    animate: { y: 0, opacity: 1 },
    exit: { y: "110%", opacity: 0 }, 
    staggerDuration: 0.01,
    transition: { type: "spring", damping: 18, stiffness: 250 },
    rotationInterval: 2200,
    splitBy: "characters", 
    auto: true,
    loop: true,
  } as const; 

  const contentDelay = 0.3;
  const itemDelayIncrement = 0.1;

  const bannerVariants: Variants = {
      hidden: { opacity: 0, y: -10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: contentDelay } }
  };
 const headlineVariants: Variants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement } }
  };
  const subHeadlineVariants: Variants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 2 } }
  };
  const formVariants: Variants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 3 } }
  };
  const trialTextVariants: Variants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 4 } }
  };
  const worksWithVariants: Variants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 5 } }
  };
  const imageVariants: Variants = {
      hidden: { opacity: 0, scale: 0.95, y: 20 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, delay: contentDelay + itemDelayIncrement * 6, ease: [0.16, 1, 0.3, 1] } }
  };


  return (
    <>
      <motion.div
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6"
      >
          <ShinyText text="" className="bg-muted border border-border text-primary px-4 py-1 rounded-full text-xs sm:text-sm font-medium cursor-pointer hover:border-primary/50 transition-colors">
            Announcing our $15M Series A
          </ShinyText>
      </motion.div>

      <motion.h1
          variants={headlineVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-5xl lg:text-[64px] font-semibold text-white leading-tight max-w-4xl mb-4"
      >
          Deliver collaborative<br />{' '}
          <span className="inline-block h-[1.2em] sm:h-[1.2em] lg:h-[1.2em] overflow-hidden align-bottom">
              <RotatingText {...rotatingTextProps} />
          </span>
      </motion.h1>

      <motion.p
          variants={subHeadlineVariants}
          initial="hidden"
          animate="visible"
          className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-8"
      >
          Support your customers on Slack, Microsoft Teams, Discord and many more – and move from answering tickets to building genuine relationships.
      </motion.p>

      <motion.form
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-md mx-auto mb-3"
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}
      >
          <input
              type="email"
              placeholder="Your work email"
              required
              aria-label="Work Email"
              className="flex-grow w-full sm:w-auto px-4 py-2 rounded-md bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          <motion.button
              type="submit"
              className="w-full sm:w-auto bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors duration-200 whitespace-nowrap shadow-sm hover:shadow-md flex-shrink-0"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
              See Nexus in action
          </motion.button>
      </motion.form>

      <motion.p
          variants={trialTextVariants}
          initial="hidden"
          animate="visible"
          className="text-xs text-gray-500 mb-10"
      >
          Free 14 day trial
      </motion.p>

      <motion.div
          variants={worksWithVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center space-y-2 mb-10"
      >
          <span className="text-xs uppercase text-gray-500 tracking-wider font-medium">Works with</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-gray-400">
              <span className="flex items-center whitespace-nowrap">Slack&nbsp;&nbsp;<SlackIcon/></span>
              <span className="flex items-center whitespace-nowrap">Teams&nbsp;&nbsp;<TeamsIcon/></span>
              <span className="flex items-center whitespace-nowrap">Discord&nbsp;&nbsp;<DiscordIcon/></span>
              <span className="flex items-center whitespace-nowrap text-muted-foreground">Email&nbsp;&nbsp;<EmailIconSvg className="text-muted-foreground"/></span>
              <span className="flex items-center whitespace-nowrap">AND MORE</span>
          </div>
      </motion.div>

      <motion.div
          variants={imageVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl mx-auto px-4 sm:px-0"
      >
          <img
              src="https://help.apple.com/assets/679AD2D1E874AD22770DE1E0/679AD2D56EA7B10C9E01288F/en_US/3d2b57c8027ae355aa44421899389008.png"
              alt="Product screen preview showing collaborative features"
              width={1024}
              height={640}
              className="w-full h-auto object-contain rounded-lg shadow-xl border border-gray-700/50"
              loading="lazy"
          />
      </motion.div>
    </>
  );
};

export default HeroContent;