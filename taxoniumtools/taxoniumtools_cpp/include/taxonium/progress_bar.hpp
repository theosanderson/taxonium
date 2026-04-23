#pragma once

#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>

namespace taxonium {

class ProgressBar {
private:
    size_t total_;
    size_t current_;
    std::string description_;
    std::chrono::steady_clock::time_point start_time_;
    std::chrono::steady_clock::time_point last_update_;
    bool completed_;
    static constexpr int update_interval_ms_ = 100; // Only update every 100ms
    
public:
    ProgressBar(size_t total, const std::string& description = "")
        : total_(total), current_(0), description_(description), completed_(false) {
        start_time_ = std::chrono::steady_clock::now();
        last_update_ = start_time_;
        if (total_ > 0) {
            std::cout << description_ << "..." << std::flush;
        }
    }
    
    ~ProgressBar() {
        if (!completed_) {
            complete();
        }
    }
    
    // Lightweight update - only displays periodically
    void update(size_t current) {
        current_ = current;
        
        auto now = std::chrono::steady_clock::now();
        auto elapsed_since_update = std::chrono::duration_cast<std::chrono::milliseconds>(now - last_update_);
        
        // Only update display if enough time has passed or we're done
        if (elapsed_since_update.count() >= update_interval_ms_ || current_ == total_) {
            display();
            last_update_ = now;
        }
    }
    
    void increment() {
        update(current_ + 1);
    }
    
    void complete() {
        if (!completed_) {
            current_ = total_;
            auto now = std::chrono::steady_clock::now();
            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - start_time_);
            double elapsed_seconds = elapsed.count() / 1000.0;
            
            std::cout << " done (" << current_ << " items, " 
                      << std::fixed << std::setprecision(2) << elapsed_seconds << "s)" << std::endl;
            completed_ = true;
        }
    }
    
private:
    void display() {
        if (total_ == 0) return;
        
        double percentage = static_cast<double>(current_) / total_;
        
        // Simple percentage display
        std::cout << "\r" << description_ << "... " 
                  << static_cast<int>(percentage * 100.0) << "% (" 
                  << current_ << "/" << total_ << ")" << std::flush;
    }
};

// No-op progress bar for performance-critical sections
class NullProgressBar {
public:
    NullProgressBar(size_t, const std::string& = "") {}
    void update(size_t) {}
    void increment() {}
    void complete() {}
};

// Conditional progress bar - can be disabled at compile time
#ifdef DISABLE_PROGRESS_BARS
using FastProgressBar = NullProgressBar;
#else
using FastProgressBar = ProgressBar;
#endif

} // namespace taxonium