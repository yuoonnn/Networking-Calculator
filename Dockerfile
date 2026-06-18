# Use official lightweight Nginx image
FROM nginx:alpine

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy your static site files into Nginx's serve directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80