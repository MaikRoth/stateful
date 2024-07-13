import React, { useState, useEffect } from "react";
import "./ShoppingList.css";

const ShoppingList = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/shopping-list");
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          console.error("Failed to fetch shopping list");
        }
      } catch (error) {
        console.error("Error fetching shopping list:", error);
      }
    };
    fetchItems();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (newItem.trim() !== "") {
      try {
        const response = await fetch("/api/shopping-list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ item: newItem, quantity: newItemQuantity }),
        });
        if (response.ok) {
          const data = await response.json(); 
          setItems([...items, data]);
          setNewItem("");
          setNewItemQuantity(1);
        } else {
          console.error("Failed to add item");
        }
      } catch (error) {
        console.error("Error adding item:", error);
      }
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      const response = await fetch(`/api/shopping-list/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleAddQuantity = async (id) => {
    try {
      const response = await fetch(`/api/shopping-list/${id}/increase`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setItems(
          items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      } else {
        console.error("Failed to increase quantity");
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
    }
  };

  const handleReduceQuantity = async (id, currentQuantity) => {
    if (currentQuantity <= 1) {
      handleRemoveItem(id);
    } else {
      try {
        const response = await fetch(`/api/shopping-list/${id}/decrease`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          setItems(
            items.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            )
          );
        } else {
          console.error("Failed to decrease quantity");
        }
      } catch (error) {
        console.error("Error decreasing quantity:", error);
      }
    }
  };

  return (
    <div className="center-container">
      <h2>Shopping List</h2>
      <form onSubmit={handleAddItem} className="add-item-form">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item"
          className="add-item-input"
        />
        <input
          type="number"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(e.target.value)}
          min="1"
          placeholder="Quantity"
          className="add-item-quantity"
        />
        <button type="submit" className="add-item-button">Add</button>
      </form>
      <ul className="shopping-list">
        {items.map((item) => (
          <li key={item.id} className="shopping-list-item">
            <button
              className="remove-button"
              onClick={() => handleRemoveItem(item.id)}
            >
              Remove
            </button>
            <span className="item-name">{item.item}</span>
            <div className="quantity-controls">
              <button
                className="quantity-button"
                onClick={() => handleReduceQuantity(item.id, item.quantity)}
              >
                -
              </button>
              <span className="item-quantity">{item.quantity}</span>
              <button
                className="quantity-button"
                onClick={() => handleAddQuantity(item.id)}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShoppingList;
