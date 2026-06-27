# Neon Chat - Modern Groq AI Chat Web App

A modern HTML, CSS, and JavaScript AI chat interface.

## Features

- Modern glassmorphism UI
- Animated neon background
- Sidebar chat history
- New chat button
- Dynamic Groq API key input
- Model selector
- Custom system prompt
- Saved settings using LocalStorage
- Typing animation
- Smooth message animation
- Responsive mobile layout
- Quick prompt buttons
- Clear chat option

## How to Run

Open `index.html` in your browser.

## API Key

Get your Groq API key from Groq Console and paste it in Settings.

## Important Security Warning

This is a frontend-only project. Your API key is visible in browser DevTools.
Do not use this architecture for a public production website.

For public hosting, use:

Browser -> Backend Proxy -> Groq API

Good backend options:
- Node.js Express
- Cloudflare Worker
- Vercel Serverless Function
- Netlify Function
