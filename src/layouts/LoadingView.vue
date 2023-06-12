<script setup>

const props = defineProps({
    isLoading: Boolean,
    size: {type: String, default: "sm"},
    containerClass: {type: String, default: ""},
})
</script>

<template>
    <div v-if="props.isLoading"
        :class="`center-items-vh full-width full-height p-2 ${props.containerClass}`"
    >
        <div :class=" 'loader loader-'+ props.size"></div>
    </div>
    <div v-else>
        <slot></slot>
    </div>
</template>
<style>
    
</style>