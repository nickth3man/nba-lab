/**
 * Deployment Configuration Tests
 * 
 * Tests that verify the deployment configuration produces valid static output
 * for Vercel and Netlify deployment.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Deployment Configuration', () => {
  const outDir = join(process.cwd(), 'out');

  describe('Static Export Output', () => {
    it('should produce out/ directory after build', () => {
      expect(existsSync(outDir)).toBe(true);
    });

    it('should generate index.html in out directory', () => {
      const indexPath = join(outDir, 'index.html');
      expect(existsSync(indexPath)).toBe(true);
      
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('html');
    });

    it('should generate nodes.json data file', () => {
      const nodesPath = join(outDir, 'data', 'nodes.json');
      expect(existsSync(nodesPath)).toBe(true);
      
      const content = readFileSync(nodesPath, 'utf-8');
      const data = JSON.parse(content);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should generate edges.json data file', () => {
      const edgesPath = join(outDir, 'data', 'edges.json');
      expect(existsSync(edgesPath)).toBe(true);
      
      const content = readFileSync(edgesPath, 'utf-8');
      const data = JSON.parse(content);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Vercel Configuration', () => {
    it('should have vercel.json with Next.js preset', () => {
      const vercelConfigPath = join(process.cwd(), 'vercel.json');
      expect(existsSync(vercelConfigPath)).toBe(true);
      
      const content = readFileSync(vercelConfigPath, 'utf-8');
      const config = JSON.parse(content);
      
      expect(config.framework).toBe('nextjs');
      expect(config.outputDirectory).toBe('out');
    });

    it('should configure cache headers for JSON data', () => {
      const vercelConfigPath = join(process.cwd(), 'vercel.json');
      const content = readFileSync(vercelConfigPath, 'utf-8');
      const config = JSON.parse(content);
      
      const dataHeaders = config.headers?.find(
        (h: { source: string }) => h.source === '/data/{path*}'
      );
      expect(dataHeaders).toBeDefined();
      expect(dataHeaders.headers).toBeDefined();
      
      const cacheControl = dataHeaders.headers.find(
        (h: { key: string }) => h.key === 'Cache-Control'
      );
      expect(cacheControl).toBeDefined();
      expect(cacheControl.value).toContain('public');
      expect(cacheControl.value).toContain('max-age');
    });
  });

  describe('Netlify Configuration', () => {
    it('should have netlify.toml with build settings', () => {
      const netlifyConfigPath = join(process.cwd(), 'netlify.toml');
      expect(existsSync(netlifyConfigPath)).toBe(true);
    });

    it('should configure build command and publish directory', () => {
      const netlifyConfigPath = join(process.cwd(), 'netlify.toml');
      const content = readFileSync(netlifyConfigPath, 'utf-8');
      
      expect(content).toContain('build-command = "npm run build"');
      expect(content).toContain('publish = "out"');
    });

    it('should configure SPA routing redirects', () => {
      const netlifyConfigPath = join(process.cwnd(), 'netlify.toml');
      const content = readFileSync(netlifyConfigPath, 'utf-8');
      
      // Should have redirect rule for single page app routing
      expect(content).toContain('[[redirects]]');
      expect(content).toContain('from = "/*"');
      expect(content).toContain('to = "/index.html"');
    });
  });

  describe('Next.js Static Export Configuration', () => {
    it('should configure next.config.ts with static export', () => {
      const nextConfigPath = join(process.cwd(), 'next.config.ts');
      expect(existsSync(nextConfigPath)).toBe(true);
      
      const content = readFileSync(nextConfigPath, 'utf-8');
      expect(content).toContain("output: 'export'");
    });

    it('should not enable server-side rendering', () => {
      const nextConfigPath = join(process.cwd(), 'next.config.ts');
      const content = readFileSync(nextConfigPath, 'utf-8');
      
      // Static export is incompatible with server-side features
      expect(content).not.toContain('experimental.serverActions');
      expect(content).not.toContain('experimental.serverComponents');
    });

    it('should configure trailing slash for static hosting compatibility', () => {
      const nextConfigPath = join(process.cwd(), 'next.config.ts');
      const content = readFileSync(nextConfigPath, 'utf-8');
      
      expect(content).toContain("trailingSlash: true");
    });
  });
});
