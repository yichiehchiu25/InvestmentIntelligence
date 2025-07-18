"""
Streamlit Example for Investment Research Platform Integration

This example demonstrates how to read and display the markdown summaries
generated by the investment research platform.

Requirements:
pip install streamlit pandas requests

Usage:
streamlit run streamlit_example.py
"""

import streamlit as st
import requests
import json
import os
from datetime import datetime, timedelta
import pandas as pd

# Configuration
API_BASE_URL = "http://localhost:5000/api"  # Update with your server URL
STORAGE_PATH = "./storage"  # Path to local storage directory

st.set_page_config(
    page_title="投資研究數據分析",
    page_icon="📊",
    layout="wide"
)

def load_local_summaries():
    """Load summaries directly from local storage"""
    summaries_path = os.path.join(STORAGE_PATH, "summaries")
    
    if not os.path.exists(summaries_path):
        return {}
    
    summaries = {}
    for date_folder in os.listdir(summaries_path):
        date_path = os.path.join(summaries_path, date_folder)
        if os.path.isdir(date_path):
            summaries[date_folder] = {}
            for file in os.listdir(date_path):
                if file.endswith('.md'):
                    category = file.replace('_', ' ').replace('.md', '')
                    file_path = os.path.join(date_path, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        summaries[date_folder][category] = f.read()
    
    return summaries

def fetch_from_api(endpoint):
    """Fetch data from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}{endpoint}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"API請求失敗: {e}")
        return None

def main():
    st.title("📊 投資研究數據分析平台")
    st.markdown("### 基於每日AI分析摘要的數據探索工具")
    
    # Sidebar for navigation
    st.sidebar.title("導航選單")
    view_mode = st.sidebar.selectbox(
        "選擇數據來源",
        ["本地檔案", "API接口", "儲存管理"]
    )
    
    if view_mode == "本地檔案":
        display_local_data()
    elif view_mode == "API接口":
        display_api_data()
    else:
        display_storage_management()

def display_local_data():
    """Display data from local storage"""
    st.header("本地儲存數據")
    
    summaries = load_local_summaries()
    
    if not summaries:
        st.warning("未找到本地摘要數據。請確保平台已運行並生成了摘要。")
        return
    
    # Date selection
    available_dates = sorted(summaries.keys(), reverse=True)
    selected_date = st.selectbox("選擇日期", available_dates)
    
    if selected_date and selected_date in summaries:
        st.subheader(f"📅 {selected_date} 市場分析摘要")
        
        # Category tabs
        categories = list(summaries[selected_date].keys())
        if categories:
            tabs = st.tabs(categories)
            
            for tab, category in zip(tabs, categories):
                with tab:
                    content = summaries[selected_date][category]
                    st.markdown(content)
        else:
            st.info("該日期無可用摘要")
    
    # Summary statistics
    st.subheader("📈 數據統計")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("總天數", len(summaries))
    
    with col2:
        total_summaries = sum(len(day_data) for day_data in summaries.values())
        st.metric("總摘要數", total_summaries)
    
    with col3:
        if summaries:
            latest_date = max(summaries.keys())
            st.metric("最新數據", latest_date)

def display_api_data():
    """Display data from API"""
    st.header("API數據接口")
    
    # Fetch available dates
    dates_data = fetch_from_api("/storage/summaries")
    
    if dates_data and "availableDates" in dates_data:
        available_dates = dates_data["availableDates"]
        
        if available_dates:
            selected_date = st.selectbox("選擇日期", available_dates)
            
            if selected_date:
                # Fetch summaries for selected date
                summaries_data = fetch_from_api(f"/storage/summaries/{selected_date}")
                
                if summaries_data:
                    st.subheader(f"📅 {selected_date} API數據")
                    
                    for summary in summaries_data:
                        with st.expander(f"📋 {summary['category']}"):
                            st.markdown(summary['content'])
        else:
            st.info("API暫無可用數據")
    else:
        st.error("無法連接到API或獲取數據")

def display_storage_management():
    """Display storage management options"""
    st.header("儲存管理")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("導出Streamlit數據")
        if st.button("導出數據"):
            try:
                response = requests.post(f"{API_BASE_URL}/storage/export-streamlit")
                if response.status_code == 200:
                    st.success("數據導出成功！")
                    data = response.json()
                    st.json(data)
                else:
                    st.error("導出失敗")
            except requests.exceptions.RequestException as e:
                st.error(f"導出請求失敗: {e}")
    
    with col2:
        st.subheader("清理舊數據")
        days_to_keep = st.number_input("保留天數", min_value=1, value=30)
        if st.button("清理數據"):
            try:
                response = requests.post(
                    f"{API_BASE_URL}/storage/cleanup",
                    json={"daysToKeep": days_to_keep}
                )
                if response.status_code == 200:
                    st.success(f"已清理超過{days_to_keep}天的舊數據")
                else:
                    st.error("清理失敗")
            except requests.exceptions.RequestException as e:
                st.error(f"清理請求失敗: {e}")
    
    # Display storage index
    st.subheader("儲存索引")
    index_data = fetch_from_api("/storage/index")
    if index_data:
        st.json(index_data)

def create_analysis_dashboard():
    """Create analysis dashboard from summaries"""
    st.header("📊 分析儀表板")
    
    summaries = load_local_summaries()
    
    if not summaries:
        st.warning("無數據可供分析")
        return
    
    # Convert to DataFrame for analysis
    data_rows = []
    for date, categories in summaries.items():
        for category, content in categories.items():
            data_rows.append({
                'date': date,
                'category': category,
                'content_length': len(content),
                'word_count': len(content.split())
            })
    
    df = pd.DataFrame(data_rows)
    
    # Display charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("各類別摘要數量")
        category_counts = df['category'].value_counts()
        st.bar_chart(category_counts)
    
    with col2:
        st.subheader("每日摘要趨勢")
        daily_counts = df.groupby('date').size()
        st.line_chart(daily_counts)

if __name__ == "__main__":
    main()
    
    # Add analysis dashboard
    if st.sidebar.checkbox("顯示分析儀表板"):
        create_analysis_dashboard()
    
    # Footer
    st.markdown("---")
    st.markdown("💡 **使用說明**: 這個工具可以讀取投資研究平台生成的每日摘要，支持本地檔案和API兩種數據來源。")
    st.markdown("🔧 **技術支持**: 確保投資研究平台正在運行，並且已經生成了一些摘要數據。")