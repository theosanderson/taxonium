#include "taxonium/node.hpp"
#include <queue>
#include <algorithm>

namespace taxonium {

Node* Node::add_child(const std::string& child_name) {
    auto child = std::make_unique<Node>(child_name);
    child->parent = this;
    Node* child_ptr = child.get();
    children.push_back(std::move(child));
    return child_ptr;
}

size_t Node::calculate_num_tips() {
    if (is_leaf()) {
        num_tips = 1;
    } else {
        num_tips = 0;
        for (auto& child : children) {
            num_tips += child->calculate_num_tips();
        }
    }
    return num_tips;
}

std::vector<Node*> Node::get_descendants() {
    std::vector<Node*> descendants;
    std::queue<Node*> queue;
    queue.push(this);
    
    while (!queue.empty()) {
        Node* current = queue.front();
        queue.pop();
        descendants.push_back(current);
        
        for (auto& child : current->children) {
            queue.push(child.get());
        }
    }
    
    return descendants;
}

std::vector<Node*> Node::get_leaves() {
    std::vector<Node*> leaves;
    std::queue<Node*> queue;
    queue.push(this);
    
    while (!queue.empty()) {
        Node* current = queue.front();
        queue.pop();
        
        if (current->is_leaf()) {
            leaves.push_back(current);
        } else {
            for (auto& child : current->children) {
                queue.push(child.get());
            }
        }
    }
    
    return leaves;
}

} // namespace taxonium