FROM ubuntu:22.04

# Install system dependencies early (these change rarely)
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    cmake \
    git \
    python3 \
    python3-pip \
    python3-biopython \
    minimap2 \
    samtools \
    bcftools \
    libboost-all-dev \
    libprotobuf-dev \
    protobuf-compiler \
    libtbb-dev \
    libisal-dev \
    && rm -rf /var/lib/apt/lists/*

# Build UShER from source FIRST (slowest step - cache this)
RUN git clone https://github.com/yatisht/usher.git /tmp/usher && \
    cd /tmp/usher && \
    mkdir build && cd build && \
    wget https://github.com/oneapi-src/oneTBB/archive/2019_U9.tar.gz && \
    tar -xvzf 2019_U9.tar.gz && \
    cmake -DTBB_DIR=${PWD}/oneTBB-2019_U9 -DCMAKE_PREFIX_PATH=${PWD}/oneTBB-2019_U9/cmake .. && \
    make -j$(nproc) && \
    cp usher /usr/local/bin/ && \
    cd / && rm -rf /tmp/usher

# Install ViralMSA
RUN wget "https://github.com/niemasd/ViralMSA/releases/latest/download/ViralMSA.py" && \
    chmod a+x ViralMSA.py && \
    mv ViralMSA.py /usr/local/bin/ViralMSA.py

# Install msa2vcf (Python-based MSA to VCF converter)
RUN pip3 install git+https://github.com/connor-lab/msa2vcf.git

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Build and install taxoniumtools_cpp
COPY taxoniumtools_cpp/ /tmp/taxoniumtools_cpp/
RUN cd /tmp/taxoniumtools_cpp && \
    rm -rf build && \
    mkdir -p build && cd build && \
    cmake .. && make -j$(nproc) && \
    cp taxoniumtools_cpp /usr/local/bin/taxoniumtools && \
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