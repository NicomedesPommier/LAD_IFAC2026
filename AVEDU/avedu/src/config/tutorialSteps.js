// src/config/tutorialSteps.js
// Tutorial steps configuration for the interactive tutorial

export const tutorialSteps = [
  {
    title: "Welcome to L.A.D! 👋",
    text: "Let's take a quick tour of the platform. This tutorial will show you how to navigate and use all the features. Click 'Next' or press the right arrow key to continue.",
    position: "bottom",
    target: null, // No specific target, centered
    buttonText: "Start Tour",
  },
  {
    title: "Units Sidebar",
    text: "This sidebar shows all available learning units. Each unit contains multiple levels (lessons) that teach specific concepts. Click on any unit to see its levels.",
    position: "right",
    target: ".learn-sidebar",
    offset: 30,
    scrollIntoView: true,
  },
  {
    title: "Select a Unit",
    text: "Try clicking on any unit in the sidebar to see its levels. For this tutorial, we'll use the Introduction unit.",
    position: "right",
    target: ".learn-sidebar ul li:first-child",
    offset: 20,
    backdropClickable: true,
    hideControls: true,
  },
  {
    title: "Levels in the Unit",
    text: "Great! Now you can see all the levels (lessons) in this unit. The sidebar updates to show what's inside the selected unit.",
    position: "right",
    target: ".learn-sidebar ul",
    offset: 30,
  },
  {
    title: "Back to Units",
    text: "See this button? It takes you back to the units list. Use it whenever you want to switch to a different unit.",
    position: "right",
    target: ".sidebar-back-button",
    offset: 20,
  },
  {
    title: "Progress Tracking",
    text: "Completed levels show a checkmark (✔) badge. This helps you track your progress through the curriculum.",
    position: "right",
    target: ".learn-sidebar .badge",
    offset: 20,
  },
  {
    title: "Level Content",
    text: "The main area displays your current level content. This could be slides, interactive simulations, or coding exercises.",
    position: "left",
    target: ".learn-stage",
    offset: 30,
  },
  {
    title: "Learning Objectives",
    text: "Each level has objectives shown as badges at the top. They track what you'll learn and automatically mark as completed as you progress.",
    position: "bottom",
    target: ".level-objectives",
    offset: 20,
  },
  {
    title: "Reset Progress",
    text: "Need to review a level? Use this reset button (↺) to restart your progress for that specific level.",
    position: "left",
    target: ".level-reset",
    offset: 15,
  },
  {
    title: "Collapse Sidebar",
    text: "Click the × button to collapse the sidebar and maximize your workspace. A menu button (☰) will appear to open it again.",
    position: "bottom",
    target: ".learn-sidebar__header .learn-toggle",
    offset: 15,
  },
  {
    title: "Theme Toggle",
    text: "Switch between dark and light modes using this toggle. Choose what's most comfortable for your eyes!",
    position: "left",
    target: ".theme-toggle",
    offset: 20,
  },
  {
    title: "You're Ready! 🎉",
    text: "That's it! You now know how to navigate the L.A.D platform. Start with the 'Introduction' unit to learn more. Happy learning!",
    position: "bottom",
    target: null,
    buttonText: "Start Learning",
  },
];

// Tutorial for when viewing a specific level
export const levelTutorialSteps = [
  {
    title: "Navigation Controls",
    text: "Use these buttons or arrow keys (← →) to navigate through slides and content.",
    position: "bottom",
    target: ".btn",
    offset: 15,
  },
  {
    title: "Progress Dots",
    text: "These dots show your progress through the content. Click any dot to jump to that section.",
    position: "top",
    target: ".tutorial-dot",
    offset: 15,
  },
];
