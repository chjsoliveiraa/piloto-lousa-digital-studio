/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isValidSemver,
  compareSemver,
  matchesSemverRange,
  isValidExtensionId,
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidSemver', () => {
    it('should validate correct semver', () => {
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('2.10.5')).toBe(true);
      expect(isValidSemver('0.0.1')).toBe(true);
      expect(isValidSemver('1.0.0-alpha')).toBe(true);
      expect(isValidSemver('1.0.0-beta.1')).toBe(true);
    });

    it('should reject invalid semver', () => {
      expect(isValidSemver('1.0')).toBe(false);
      expect(isValidSemver('1')).toBe(false);
      expect(isValidSemver('1.0.0.0')).toBe(false);
      expect(isValidSemver('v1.0.0')).toBe(false);
      expect(isValidSemver('1.0.0-')).toBe(false);
    });
  });

  describe('compareSemver', () => {
    it('should compare versions correctly', () => {
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.2.0', '1.1.0')).toBe(1);
      expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    });
  });

  describe('matchesSemverRange', () => {
    it('should match exact version', () => {
      expect(matchesSemverRange('1.0.0', '1.0.0')).toBe(true);
      expect(matchesSemverRange('1.0.0', '1.0.1')).toBe(false);
    });

    it('should match wildcard ranges', () => {
      expect(matchesSemverRange('1.5.3', '1.x.x')).toBe(true);
      expect(matchesSemverRange('2.0.0', '1.x.x')).toBe(false);
      expect(matchesSemverRange('1.5.3', '1.5.x')).toBe(true);
      expect(matchesSemverRange('1.6.0', '1.5.x')).toBe(false);
    });

    it('should match caret ranges', () => {
      expect(matchesSemverRange('1.5.0', '^1.0.0')).toBe(true);
      expect(matchesSemverRange('1.9.9', '^1.0.0')).toBe(true);
      expect(matchesSemverRange('2.0.0', '^1.0.0')).toBe(false);
      expect(matchesSemverRange('0.9.0', '^1.0.0')).toBe(false);
    });

    it('should match tilde ranges', () => {
      expect(matchesSemverRange('1.0.5', '~1.0.0')).toBe(true);
      expect(matchesSemverRange('1.0.9', '~1.0.0')).toBe(true);
      expect(matchesSemverRange('1.1.0', '~1.0.0')).toBe(false);
      expect(matchesSemverRange('0.9.9', '~1.0.0')).toBe(false);
    });

    it('should match >= ranges', () => {
      expect(matchesSemverRange('1.0.0', '>=1.0.0')).toBe(true);
      expect(matchesSemverRange('1.5.0', '>=1.0.0')).toBe(true);
      expect(matchesSemverRange('2.0.0', '>=1.0.0')).toBe(true);
      expect(matchesSemverRange('0.9.0', '>=1.0.0')).toBe(false);
    });
  });

  describe('isValidExtensionId', () => {
    it('should validate correct extension IDs', () => {
      expect(isValidExtensionId('com.example.myextension')).toBe(true);
      expect(isValidExtensionId('com.example.my-extension')).toBe(true);
      expect(isValidExtensionId('org.lousa.digital.templates')).toBe(true);
    });

    it('should reject invalid extension IDs', () => {
      expect(isValidExtensionId('example')).toBe(false);
      expect(isValidExtensionId('com.example')).toBe(false);
      expect(isValidExtensionId('Com.Example.Test')).toBe(false); // Uppercase
      expect(isValidExtensionId('com.example.')).toBe(false); // Trailing dot
      expect(isValidExtensionId('.com.example.test')).toBe(false); // Leading dot
      expect(isValidExtensionId('com..example.test')).toBe(false); // Double dot
    });
  });
});
