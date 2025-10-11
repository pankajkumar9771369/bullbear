import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Hero from '../landing_page/home/Hero';  // Adjust the path based on your directory structure

describe('Hero component', () => {
  test('renders hero image', () => {
    render(<Hero />);
    
    // Use getByAltText instead of getAllByAltText if there's only one image
    const heroImage = screen.getByAltText('Hero Image');
    
    // Assertions
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute('src', 'media/images/homeHero.png');
  });
});
