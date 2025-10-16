#pragma once

#include <vector>
#include <memory>
#include <cstddef>

namespace taxonium {

// Simple memory pool for fixed-size allocations
template<typename T>
class MemoryPool {
private:
    struct Block {
        std::vector<T> items;
        size_t used;
        
        Block(size_t size) : items(size), used(0) {}
    };
    
    std::vector<std::unique_ptr<Block>> blocks;
    size_t block_size;
    Block* current_block;
    
public:
    explicit MemoryPool(size_t block_size = 1024) 
        : block_size(block_size), current_block(nullptr) {
        allocate_block();
    }
    
    T* allocate() {
        if (current_block->used >= block_size) {
            allocate_block();
        }
        return &current_block->items[current_block->used++];
    }
    
    void clear() {
        blocks.clear();
        current_block = nullptr;
        allocate_block();
    }
    
private:
    void allocate_block() {
        blocks.push_back(std::make_unique<Block>(block_size));
        current_block = blocks.back().get();
    }
};

// Pool allocator for STL containers
template<typename T>
class PoolAllocator {
private:
    MemoryPool<T>* pool;
    
public:
    using value_type = T;
    
    explicit PoolAllocator(MemoryPool<T>* p) : pool(p) {}
    
    template<typename U>
    PoolAllocator(const PoolAllocator<U>& other) : pool(other.pool) {}
    
    T* allocate(size_t n) {
        if (n != 1) {
            throw std::bad_alloc();  // Only support single allocations
        }
        return pool->allocate();
    }
    
    void deallocate(T* p, size_t n) {
        // No-op - pool handles all memory
    }
    
    template<typename U>
    bool operator==(const PoolAllocator<U>& other) const {
        return pool == other.pool;
    }
    
    template<typename U>
    bool operator!=(const PoolAllocator<U>& other) const {
        return !(*this == other);
    }
};

} // namespace taxonium