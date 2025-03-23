#!/bin/bash

# Create directories if they don't exist
mkdir -p assets/icons

# Function to create app icon with blue background and play triangle
create_app_icon() {
  size=$1
  output=$2
  
  # Create blue background with play triangle
  convert -size ${size}x${size} xc:'#2196F3' \
    -fill white -draw "polygon $(($size/4)),$(($size/4)) $(($size*3/4)),$(($size/2)) $(($size/4)),$(($size*3/4))" \
    "$output"
  
  echo "Created app icon: $output"
}

# Function to create play icon
create_play_icon() {
  size=$1
  output=$2
  
  # Create blue circle with play triangle
  convert -size ${size}x${size} xc:none -fill '#0078D7' -draw "circle $(($size/2)),$(($size/2)) $(($size/2)),$(($size-1))" \
    -fill white -draw "polygon $(($size/3)),$(($size/3)) $(($size*2/3)),$(($size/2)) $(($size/3)),$(($size*2/3))" \
    "$output"
  
  echo "Created play icon: $output"
}

# Create app icons in different sizes
for size in 48 72 96 144 192; do
  create_app_icon $size "assets/icons/app_icon_${size}.png"
done

# Create play icon in different sizes
for size in 48 72; do
  create_play_icon $size "assets/icons/play_icon_${size}.png"
done

echo "Icons created successfully!"
