FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    cmake \
    git \
    minimap2 \
    samtools \
    bcftools \
    libboost-all-dev \
    libprotobuf-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Download and install UShER manually
RUN wget https://github.com/yatisht/usher/releases/download/v0.6.2/usher-0.6.2 && \
    chmod +x usher-0.6.2 && \
    mv usher-0.6.2 /usr/local/bin/usher

# Build and install taxoniumtools_cpp
COPY taxoniumtools_cpp/ /tmp/taxoniumtools_cpp/
RUN cd /tmp/taxoniumtools_cpp && \
    mkdir -p build && cd build && \
    cmake .. && make -j$(nproc) && \
    cp taxoniumtools /usr/local/bin/ && \
    cd / && rm -rf /tmp/taxoniumtools_cpp

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p temp reference

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/server.js"]